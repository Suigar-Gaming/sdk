// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@mysten/sui/transactions';
import {
	type CoinSide,
	type Game,
	type PvPCoinflipAction,
	type StandardGame,
} from '@suigar/sdk/games';
import {
	buildTransactionResult,
	createSuigarClient,
	resolveDefaultCoinType,
	resolveOwnerAddress,
	type ReadOnlyPlan,
	type ResolvedMcpConfig,
	type SuigarClientBundle,
	type TransactionSummaryContext,
} from '../../runtime/index.js';
import {
	BASE_UNIT_AMOUNT_PATTERN,
	POSITIVE_INTEGER_PATTERN,
	toBaseUnits,
	toCurrencyAmountText,
} from '../../utils/index.js';
import {
	createExecutionBridge,
	resolveFrontendOrigin,
} from '../../wallet/index.js';
import type {
	CoinflipInput,
	ConfigIdInput,
	LimboInput,
	PvpCoinflipCancelInput,
	PvpCoinflipCreateInput,
	PvpCoinflipJoinInput,
	RangeInput,
	SoccerInput,
	StandardTransactionToolInput,
	TransactionToolInput,
} from '../schemas/index.js';
import {
	asTextResponse,
	coinMetadataForAmount,
	GAME_LABELS,
	getConfigInput,
	getMode,
	getPackageId,
	requireString,
} from './shared.js';

export const buildCoinflipTransactionTool = async (
	input: CoinflipInput = {},
) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'coinflip',
				requiredInputs: ['owner', 'stake', 'side'],
				notes: [
					'Uses the configured SweetHouse object, Pyth price info, clock, and randomness objects.',
				],
			}),
		);
	}

	const side = requireString(input.side, 'side') as CoinSide;
	return buildTransactionTool({
		input,
		game: 'coinflip',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { side },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createGameBet('coinflip', {
				...(await stakeOptions(input, bundle)),
				side,
			}),
	});
};

export const buildLimboTransactionTool = async (input: LimboInput = {}) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'limbo',
				requiredInputs: ['owner', 'stake', 'targetMultiplier'],
				notes: [
					'Target multiplier is encoded by @suigar/sdk using the public fixed-point utility defaults.',
				],
			}),
		);
	}

	const targetMultiplier = requireNumber(
		input.targetMultiplier,
		'targetMultiplier',
	);
	return buildTransactionTool({
		input,
		game: 'limbo',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { targetMultiplier },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createGameBet('limbo', {
				...(await stakeOptions(input, bundle)),
				targetMultiplier,
			}),
	});
};

const buildConfigIdTransactionTool = async (
	input: ConfigIdInput,
	game: Extract<StandardGame, 'plinko' | 'wheel'>,
) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game,
				requiredInputs: ['owner', 'stake', 'configId'],
				notes: ['Config id selects the on-chain game configuration.'],
			}),
		);
	}

	const configId = requireNumber(input.configId, 'configId');
	return buildTransactionTool({
		input,
		game,
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { configId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createGameBet(game, {
				...(await stakeOptions(input, bundle)),
				configId,
			}),
	});
};

export const buildPlinkoTransactionTool = (input: ConfigIdInput = {}) =>
	buildConfigIdTransactionTool(input, 'plinko');

export const buildWheelTransactionTool = (input: ConfigIdInput = {}) =>
	buildConfigIdTransactionTool(input, 'wheel');

export const buildRangeTransactionTool = async (input: RangeInput = {}) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'range',
				requiredInputs: ['owner', 'stake', 'leftPoint', 'rightPoint'],
				notes: [
					'Range points are normalized by @suigar/sdk before Move call construction.',
				],
			}),
		);
	}

	const leftPoint = requireNumber(input.leftPoint, 'leftPoint');
	const rightPoint = requireNumber(input.rightPoint, 'rightPoint');
	const outOfRange = Boolean(input.outOfRange);
	return buildTransactionTool({
		input,
		game: 'range',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { leftPoint, rightPoint, outOfRange },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createGameBet('range', {
				...(await stakeOptions(input, bundle)),
				leftPoint,
				rightPoint,
				outOfRange,
			}),
	});
};

export const buildSoccerTransactionTool = async (input: SoccerInput = {}) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'soccer',
				requiredInputs: [
					'owner',
					'stake',
					'configId',
					'countryId',
					'shotZoneId',
				],
				notes: [
					'Config, country, and shot zone ids select the on-chain Soccer game settings.',
				],
			}),
		);
	}

	const configId = requireNumber(input.configId, 'configId');
	const countryId = requireNumber(input.countryId, 'countryId');
	const shotZoneId = requireNumber(input.shotZoneId, 'shotZoneId');
	return buildTransactionTool({
		input,
		game: 'soccer',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { configId, countryId, shotZoneId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createGameBet('soccer', {
				...(await stakeOptions(input, bundle)),
				configId,
				countryId,
				shotZoneId,
			}),
	});
};

export const buildPvpCoinflipCreateTransactionTool = async (
	input: PvpCoinflipCreateInput = {},
) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'pvp-coinflip',
				action: 'create',
				requiredInputs: ['owner', 'stake', 'creatorSide'],
				notes: [
					'Creates an unresolved PvP coinflip lobby without signing or executing the transaction.',
				],
			}),
		);
	}

	const creatorSide = requireString(
		input.creatorSide,
		'creatorSide',
	) as CoinSide;
	return buildTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'create',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: {
			creatorSide,
			...(input.isPrivate == null ? {} : { isPrivate: input.isPrivate }),
		},
		createTransaction: async (bundle) => {
			const { decimals } = coinMetadataForAmount(bundle.config, input.coinType);
			return bundle.client.suigar.tx.pvpCoinflip.createGame({
				...(await gameTransactionOptions(input, bundle)),
				stake: toBaseUnits(input.stake, 'stake', decimals),
				side: creatorSide,
				isPrivate: input.isPrivate,
			});
		},
	});
};

export const buildPvpCoinflipJoinTransactionTool = async (
	input: PvpCoinflipJoinInput = {},
) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'pvp-coinflip',
				action: 'join',
				requiredInputs: ['owner', 'gameId'],
				notes: [
					'Join resolves the live game object during transaction build so the SDK can source the matching stake.',
				],
			}),
		);
	}

	const gameId = requireString(input.gameId, 'gameId');
	return buildTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'join',
		gameInputs: { gameId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.pvpCoinflip.joinGame({
				...(await gameTransactionOptions(input, bundle)),
				gameId,
			}),
	});
};

export const buildPvpCoinflipCancelTransactionTool = async (
	input: PvpCoinflipCancelInput = {},
) => {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'pvp-coinflip',
				action: 'cancel',
				requiredInputs: ['owner', 'gameId'],
				notes: [
					'Cancel only prepares the unsigned cancellation transaction for the game creator.',
				],
			}),
		);
	}

	const gameId = requireString(input.gameId, 'gameId');
	return buildTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'cancel',
		gameInputs: { gameId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.pvpCoinflip.cancelGame({
				...(await gameTransactionOptions(input, bundle)),
				gameId,
			}),
	});
};

const BET_COUNT_LIMITS: Partial<
	Record<Game, { parameter: string; label: string }>
> = {
	limbo: { parameter: 'max_number_of_games', label: 'games' },
	plinko: { parameter: 'max_number_of_balls', label: 'balls' },
	range: { parameter: 'max_number_of_games', label: 'games' },
	soccer: { parameter: 'max_number_of_shots', label: 'shots' },
	wheel: { parameter: 'max_number_of_spins', label: 'spins' },
};
export const toPositiveInteger = (
	value: unknown,
	fieldName: string,
): number | bigint => {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
		return value;
	}
	if (typeof value === 'string' && POSITIVE_INTEGER_PATTERN.test(value)) {
		return BigInt(value);
	}
	throw new TypeError(
		`Missing or invalid ${fieldName}. Provide a positive integer.`,
	);
};
export const requireNumber = (value: unknown, fieldName: string): number => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	throw new TypeError(`Missing or invalid numeric field: ${fieldName}.`);
};
const getTarget = (
	config: ResolvedMcpConfig,
	game: Game,
	action?: PvPCoinflipAction,
) => {
	const packageId = getPackageId(config, game);
	if (game === 'pvp-coinflip') {
		const functionName = `${action?.toLowerCase() ?? 'create'}_game`;
		return `${packageId}::${game}::${functionName}`;
	}
	return `${packageId}::${game}::play`;
};
export const readOnlyPlan = ({
	input,
	game,
	action,
	requiredInputs,
	notes,
}: {
	input: TransactionToolInput;
	game: Game;
	action?: PvPCoinflipAction;
	requiredInputs: Array<string>;
	notes: Array<string>;
}): ReadOnlyPlan => {
	const { config } = createSuigarClient(getConfigInput(input));
	const coinType = resolveDefaultCoinType(config, input.coinType);
	return {
		mode: 'read-only',
		network: config.network,
		game,
		action,
		config,
		plan: {
			target: getTarget(config, game, action),
			typeArguments: [coinType],
			requiredInputs,
			notes,
		},
	};
};

const gameTransactionOptions = async (
	input: TransactionToolInput,
	bundle: SuigarClientBundle,
) => {
	return {
		owner: await resolveOwnerAddress(
			requireString(input.owner, 'owner'),
			bundle,
		),
		coinType: resolveDefaultCoinType(bundle.config, input.coinType),
		metadata: input.metadata,
		gasBudget: input.gasBudget,
		useGasCoin: input.useGasCoin,
	};
};

const enforceBetCountLimit = async (
	game: Game,
	input: TransactionToolInput,
	bundle: SuigarClientBundle,
) => {
	if (!('betCount' in input) || input.betCount == null) {
		return;
	}

	const limit = BET_COUNT_LIMITS[game];
	if (!limit) {
		return;
	}

	const requested = BigInt(toPositiveInteger(input.betCount, 'betCount'));
	const parameters = await bundle.client.suigar.getGameParameters(game, {
		coinType: resolveDefaultCoinType(bundle.config, input.coinType),
	});
	const max = (parameters as Record<string, unknown>)[limit.parameter];
	if (
		(typeof max !== 'bigint' &&
			typeof max !== 'number' &&
			typeof max !== 'string') ||
		!BASE_UNIT_AMOUNT_PATTERN.test(String(max))
	) {
		throw new Error(
			`Unable to read ${limit.parameter} from on-chain ${GAME_LABELS[game]} parameters.`,
		);
	}

	const maximum = BigInt(max);
	if (requested > maximum) {
		throw new RangeError(
			`betCount cannot exceed ${maximum.toString()} ${limit.label} per ${GAME_LABELS[game]} transaction.`,
		);
	}
};

export const stakeOptions = async (
	input: StandardTransactionToolInput,
	bundle: SuigarClientBundle,
) => {
	const { decimals } = coinMetadataForAmount(bundle.config, input.coinType);
	return {
		...(await gameTransactionOptions(input, bundle)),
		stake: toBaseUnits(input.stake, 'stake', decimals),
		...(input.cashStake == null
			? {}
			: {
					cashStake: toBaseUnits(input.cashStake, 'cashStake', decimals),
				}),
		...(input.betCount == null
			? {}
			: { betCount: toPositiveInteger(input.betCount, 'betCount') }),
	};
};

export const buildTransactionTool = async ({
	input,
	game,
	action,
	createTransaction,
	stake,
	stakeDisplay,
	gameInputs,
}: {
	input: TransactionToolInput;
	createTransaction: (bundle: SuigarClientBundle) => Promise<Transaction>;
} & Pick<Required<TransactionSummaryContext>, 'game'> &
	Pick<
		TransactionSummaryContext,
		'action' | 'stake' | 'stakeDisplay' | 'gameInputs'
	>) => {
	const mode = getMode(input.mode);
	if (mode === 'read-only') {
		throw new Error(
			'read-only mode must be handled before transaction execution.',
		);
	}

	const bundle = createSuigarClient(getConfigInput(input));
	await enforceBetCountLimit(game, input, bundle);
	const coin = coinMetadataForAmount(bundle.config, input.coinType);
	const baseStake =
		stake ??
		(stakeDisplay == null
			? undefined
			: toBaseUnits(stakeDisplay, 'stake', coin.decimals));
	const transaction = await createTransaction(bundle);
	if (mode === 'execute') {
		const built = await buildTransactionResult({
			mode: 'build',
			transaction,
			config: bundle.config,
			client: bundle.client,
			context: {
				game,
				action,
				coinType: coin.coinType,
				stake: baseStake,
				stakeDisplay,
				coinDecimals: coin.decimals,
				gameInputs,
			},
		});
		const execution = await createExecutionBridge({
			network: bundle.config.network,
			frontendOrigin: resolveFrontendOrigin(bundle.config.network),
			transactionBytesBase64: built.transactionBytesBase64 ?? '',
			summary: built.summary,
		});
		return asTextResponse({
			mode: 'execute',
			network: bundle.config.network,
			config: bundle.config,
			summary: built.summary,
			execution: { ...execution, status: 'pending' },
		});
	}
	return asTextResponse(
		await buildTransactionResult({
			mode,
			transaction,
			config: bundle.config,
			client: bundle.client,
			context: {
				game,
				action,
				coinType: coin.coinType,
				stake: baseStake,
				stakeDisplay,
				coinDecimals: coin.decimals,
				gameInputs,
			},
		}),
	);
};
