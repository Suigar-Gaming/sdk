import type { Transaction } from '@mysten/sui/transactions';
import type {
	CoinflipFormValues,
	PvPAction,
	PvPCancelFormValues,
	PvPCreateFormValues,
	PvPForms,
	PvPJoinFormValues,
	SharedFields,
	StandardForms,
	StandardGameId,
	LimboFormValues,
	PlinkoFormValues,
	RangeFormValues,
	SupportedCoinKey,
	WheelFormValues,
} from '@/lib/suigar-app';
import {
	COIN_DECIMALS,
	parseOptionalNumber,
	toAtomicAmount,
} from '@/lib/suigar-app';

type SuigarClientLike = {
	suigar: {
		tx: unknown;
	};
};

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
	client: SuigarClientLike,
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
	const txApi = client.suigar.tx as {
		createBetTransaction: (
			gameId: StandardGameId,
			options: unknown,
		) => Transaction;
	};

	switch (gameId) {
		case 'coinflip': {
			const typedForm = form as CoinflipFormValues;
			baseOptions.side = typedForm.side;
			codeLines.push(`side: '${typedForm.side}',`);
			return {
				transaction: txApi.createBetTransaction(gameId, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createBetTransaction('${gameId}',`,
					codeLines,
				),
			};
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
			return {
				transaction: txApi.createBetTransaction(gameId, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createBetTransaction('${gameId}',`,
					codeLines,
				),
			};
		}
		case 'plinko': {
			const typedForm = form as PlinkoFormValues;
			baseOptions.configId = Number(typedForm.configId);
			codeLines.push(`configId: ${Number(typedForm.configId)},`);
			return {
				transaction: txApi.createBetTransaction(gameId, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createBetTransaction('${gameId}',`,
					codeLines,
				),
			};
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
			return {
				transaction: txApi.createBetTransaction(gameId, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createBetTransaction('${gameId}',`,
					codeLines,
				),
			};
		}
		case 'wheel': {
			const typedForm = form as WheelFormValues;
			baseOptions.configId = Number(typedForm.configId);
			codeLines.push(`configId: ${Number(typedForm.configId)},`);
			return {
				transaction: txApi.createBetTransaction(gameId, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createBetTransaction('${gameId}',`,
					codeLines,
				),
			};
		}
	}
}

export function buildPvPTransaction<K extends PvPAction>(
	client: SuigarClientLike,
	action: K,
	form: PvPForms[K],
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
	const txApi = client.suigar.tx as {
		createPvPCoinflipTransaction: (
			action: PvPAction,
			options: unknown,
		) => Transaction;
	};

	switch (action) {
		case 'create': {
			const typedForm = form as PvPCreateFormValues;
			baseOptions.side = typedForm.side;
			baseOptions.isPrivate = typedForm.isPrivate;
			codeLines.push(`side: '${typedForm.side}',`);
			codeLines.push(`isPrivate: ${typedForm.isPrivate},`);
			return {
				transaction: txApi.createPvPCoinflipTransaction(action, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}',`,
					codeLines,
				),
			};
		}
		case 'join': {
			const typedForm = form as PvPJoinFormValues;
			baseOptions.gameId = typedForm.gameId.trim();
			codeLines.push(`gameId: '${typedForm.gameId.trim()}',`);
			return {
				transaction: txApi.createPvPCoinflipTransaction(action, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}',`,
					codeLines,
				),
			};
		}
		case 'cancel': {
			const typedForm = form as PvPCancelFormValues;
			baseOptions.gameId = typedForm.gameId.trim();
			codeLines.push(`gameId: '${typedForm.gameId.trim()}',`);
			return {
				transaction: txApi.createPvPCoinflipTransaction(action, baseOptions),
				code: toCodeBlock(
					`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}',`,
					codeLines,
				),
			};
		}
	}
}
