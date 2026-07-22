import type { SuigarClient } from '@suigar/sdk';
import { parseOptionalNumber, toAtomicAmount } from '@/lib/suigar-app';
import type {
	CoinflipFormValues,
	LimboFormValues,
	PlinkoFormValues,
	PvPAction,
	PvPCoinflipCancelFormValues,
	PvPCoinflipCreateFormValues,
	PvPCoinflipForms,
	PvPCoinflipJoinFormValues,
	RangeFormValues,
	SharedFields,
	SoccerFormValues,
	StandardForms,
	StandardGameId,
	StandardSharedFields,
	WheelFormValues,
} from '@/lib/suigar-types';

type TxApi = SuigarClient['tx'];

export const PREVIEW_PLAYER_ADDRESS = `0x${'0'.repeat(64)}`;

function getBetCountInput(fields: StandardSharedFields) {
	return fields.betCount?.trim() ?? '';
}

function parseBetCount(value: string) {
	if (!/^\d+$/.test(value)) {
		throw new Error('Bet count must be a whole number.');
	}

	const betCount = BigInt(value);
	if (betCount < BigInt(1)) {
		throw new Error('Bet count must be at least 1.');
	}

	return betCount;
}

function buildSharedOptions(
	owner: string,
	coinType: string,
	coinDecimals: number,
	fields: SharedFields,
) {
	const atomicStake = toAtomicAmount(fields.stake, coinDecimals);
	const baseOptions: Record<string, unknown> = {
		owner,
		coinType,
		stake: atomicStake,
	};
	const codeLines = [
		`owner: '${owner}',`,
		`coinType: '${coinType}',`,
		`stake: ${atomicStake.toString()}n,`,
	];

	return {
		baseOptions,
		codeLines,
	};
}

function buildStandardSharedOptions(
	owner: string,
	coinType: string,
	coinDecimals: number,
	fields: StandardSharedFields,
) {
	const { baseOptions, codeLines } = buildSharedOptions(
		owner,
		coinType,
		coinDecimals,
		fields,
	);
	const rawBetCount = getBetCountInput(fields);

	if (rawBetCount) {
		baseOptions.betCount = parseBetCount(rawBetCount);
		codeLines.push(`betCount: ${rawBetCount}n,`);
	}

	return {
		baseOptions,
		codeLines,
	};
}

function toCodeBlock(factoryLine: string, codeLines: string[]) {
	return `${factoryLine} {\n${codeLines.map((line) => `\t${line}`).join('\n')}\n});`;
}

export function buildPvPPreviewFallback(
	action: 'join' | 'cancel',
	{
		owner,
		coinType,
	}: {
		owner: string;
		coinType: string;
	},
) {
	return toCodeBlock(
		`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}',`,
		[`owner: '${owner}',`, `coinType: '${coinType}',`, `gameId: '0xGAME_ID',`],
	);
}

export function buildStandardTransaction<K extends StandardGameId>(
	client: { suigar: SuigarClient },
	gameId: K,
	form: StandardForms[K],
	owner: string,
	coinDecimals: number,
	coinType: string,
) {
	const { baseOptions, codeLines } = buildStandardSharedOptions(
		owner,
		coinType,
		coinDecimals,
		form,
	);
	const txApi: TxApi = client.suigar.tx;

	switch (gameId) {
		case 'coinflip': {
			const typedForm = form as CoinflipFormValues;
			baseOptions.side = typedForm.side;
			codeLines.push(`side: '${typedForm.side}',`);
			break;
		}
		case 'limbo': {
			const typedForm = form as LimboFormValues;
			baseOptions.targetMultiplier = Number(typedForm.targetMultiplier);
			codeLines.push(
				`targetMultiplier: ${Number(typedForm.targetMultiplier)},`,
			);
			const scale = parseOptionalNumber(typedForm.scale);
			if (scale !== undefined) {
				baseOptions.scale = scale;
				codeLines.push(`scale: ${scale},`);
			}
			break;
		}
		case 'plinko': {
			const typedForm = form as PlinkoFormValues;
			baseOptions.configId = Number(typedForm.configId);
			codeLines.push(`configId: ${Number(typedForm.configId)},`);
			break;
		}
		case 'range': {
			const typedForm = form as RangeFormValues;
			baseOptions.leftPoint = Number(typedForm.leftPoint);
			baseOptions.rightPoint = Number(typedForm.rightPoint);
			baseOptions.outOfRange = typedForm.outOfRange;
			codeLines.push(`leftPoint: ${Number(typedForm.leftPoint)},`);
			codeLines.push(`rightPoint: ${Number(typedForm.rightPoint)},`);
			codeLines.push(`outOfRange: ${typedForm.outOfRange},`);
			const scale = parseOptionalNumber(typedForm.scale);
			if (scale !== undefined) {
				baseOptions.scale = scale;
				codeLines.push(`scale: ${scale},`);
			}
			break;
		}
		case 'soccer': {
			const typedForm = form as SoccerFormValues;
			baseOptions.configId = Number(typedForm.configId);
			baseOptions.countryId = Number(typedForm.countryId);
			baseOptions.shotZoneId = Number(typedForm.shotZoneId);
			codeLines.push(`configId: ${Number(typedForm.configId)},`);
			codeLines.push(`countryId: ${Number(typedForm.countryId)},`);
			codeLines.push(`shotZoneId: ${Number(typedForm.shotZoneId)},`);
			break;
		}
		case 'wheel': {
			const typedForm = form as WheelFormValues;
			baseOptions.configId = Number(typedForm.configId);
			codeLines.push(`configId: ${Number(typedForm.configId)},`);
			break;
		}
	}

	return {
		// oxlint-disable-next-line typescript/no-explicit-any
		transaction: txApi.createBetTransaction(gameId, baseOptions as any),
		code: toCodeBlock(
			`const tx = client.suigar.tx.createBetTransaction('${gameId}',`,
			codeLines,
		),
	};
}

export function buildPvPTransaction<K extends PvPAction>(
	client: { suigar: SuigarClient },
	action: K,
	form: PvPCoinflipForms[K],
	owner: string,
	coinDecimals: number,
	coinType: string,
) {
	const txApi: TxApi = client.suigar.tx;
	let baseOptions: Record<string, unknown> = {};
	let codeLines: string[] = [];

	switch (action) {
		case 'create': {
			const typedForm = form as PvPCoinflipCreateFormValues;
			({ baseOptions, codeLines } = buildSharedOptions(
				owner,
				coinType,
				coinDecimals,
				typedForm,
			));
			baseOptions.side = typedForm.side;
			baseOptions.isPrivate = typedForm.isPrivate;
			codeLines.push(`side: '${typedForm.side}',`);
			codeLines.push(`isPrivate: ${typedForm.isPrivate},`);
			break;
		}
		case 'join': {
			const typedForm = form as PvPCoinflipJoinFormValues;
			const gameId = typedForm.gameId?.trim() ?? '';
			baseOptions = {
				owner,
				coinType,
				gameId,
			};
			codeLines = [
				`owner: '${owner}',`,
				`coinType: '${coinType}',`,
				`gameId: '${gameId}',`,
			];
			break;
		}
		case 'cancel': {
			const typedForm = form as PvPCoinflipCancelFormValues;
			const gameId = typedForm.gameId?.trim() ?? '';
			baseOptions = {
				owner,
				coinType,
				gameId,
			};
			codeLines = [
				`owner: '${owner}',`,
				`coinType: '${coinType}',`,
				`gameId: '${gameId}',`,
			];
			break;
		}
	}

	return {
		// oxlint-disable-next-line typescript/no-explicit-any
		transaction: txApi.createPvPCoinflipTransaction(action, baseOptions as any),
		code: toCodeBlock(
			`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}',`,
			codeLines,
		),
	};
}
