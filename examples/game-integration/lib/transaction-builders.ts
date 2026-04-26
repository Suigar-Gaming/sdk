import type { SuigarClient } from '@suigar/sdk';
import type {
	CoinflipFormValues,
	PvPAction,
	PvPCoinflipCancelFormValues,
	PvPCoinflipCreateFormValues,
	PvPCoinflipForms,
	PvPCoinflipJoinFormValues,
	SharedFields,
	StandardForms,
	StandardGameId,
	LimboFormValues,
	PlinkoFormValues,
	RangeFormValues,
	SupportedCoinKey,
	WheelFormValues,
} from '@/lib/suigar-types';
import {
	COIN_DECIMALS,
	parseOptionalNumber,
	toAtomicAmount,
} from '@/lib/suigar-app';

type TxApi = SuigarClient['tx'];

function buildSharedOptions(
	owner: string,
	coinType: string,
	coinKey: SupportedCoinKey,
	fields: SharedFields,
) {
	const atomicStake = toAtomicAmount(fields.stake, COIN_DECIMALS[coinKey]);
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

function toCodeBlock(factoryLine: string, codeLines: string[]) {
	return `${factoryLine} {\n${codeLines.map((line) => `\t${line}`).join('\n')}\n});`;
}

export function buildStandardTransaction<K extends StandardGameId>(
	client: { suigar: SuigarClient },
	gameId: K,
	form: StandardForms[K],
	owner: string,
	coinKey: SupportedCoinKey,
	coinType: string,
) {
	const { baseOptions, codeLines } = buildSharedOptions(
		owner,
		coinType,
		coinKey,
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
		case 'wheel': {
			const typedForm = form as WheelFormValues;
			baseOptions.configId = Number(typedForm.configId);
			codeLines.push(`configId: ${Number(typedForm.configId)},`);
			break;
		}
	}

	return {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
	coinKey: SupportedCoinKey,
	coinType: string,
) {
	const txApi: TxApi = client.suigar.tx;
	let baseOptions: Record<string, unknown>;
	let codeLines: string[];

	switch (action) {
		case 'create': {
			const typedForm = form as PvPCoinflipCreateFormValues;
			({ baseOptions, codeLines } = buildSharedOptions(
				owner,
				coinType,
				coinKey,
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
			baseOptions = {
				owner,
				coinType,
				gameId: typedForm.gameId.trim(),
			};
			codeLines = [
				`owner: '${owner}',`,
				`coinType: '${coinType}',`,
				`gameId: '${typedForm.gameId.trim()}',`,
			];
			break;
		}
		case 'cancel': {
			const typedForm = form as PvPCoinflipCancelFormValues;
			baseOptions = {
				owner,
				coinType,
				gameId: typedForm.gameId.trim(),
			};
			codeLines = [
				`owner: '${owner}',`,
				`coinType: '${coinType}',`,
				`gameId: '${typedForm.gameId.trim()}',`,
			];
			break;
		}
	}

	return {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		transaction: txApi.createPvPCoinflipTransaction(action, baseOptions as any),
		code: toCodeBlock(
			`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}',`,
			codeLines,
		),
	};
}
