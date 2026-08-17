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
	executeSessionTransaction,
	resolveDefaultCoinType,
	resolveOwnerAddress,
	type McpConfig,
	type ReadOnlyPlan,
	type SuigarClientBundle,
	type ToolTextResult,
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
	loadSessionSigner,
	loadSessionWallet,
	resolveWebOrigin,
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

export async function buildCoinflipTransactionTool(
	input: CoinflipInput = {},
): Promise<ToolTextResult> {
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
			bundle.client.suigar.tx.createGameBet({
				game: 'coinflip',
				...(await stakeOptions(input, bundle)),
				side,
			}),
	});
}

export async function buildLimboTransactionTool(input: LimboInput = {}): Promise<ToolTextResult> {
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

	const targetMultiplier = requireNumber(input.targetMultiplier, 'targetMultiplier');
	return buildTransactionTool({
		input,
		game: 'limbo',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { targetMultiplier },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createGameBet({
				game: 'limbo',
				...(await stakeOptions(input, bundle)),
				targetMultiplier,
			}),
	});
}

async function buildConfigIdTransactionTool(
	input: ConfigIdInput,
	game: Extract<StandardGame, 'plinko' | 'wheel'>,
): Promise<ToolTextResult> {
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
			bundle.client.suigar.tx.createGameBet({
				game,
				...(await stakeOptions(input, bundle)),
				configId,
			}),
	});
}

export function buildPlinkoTransactionTool(input: ConfigIdInput = {}): Promise<ToolTextResult> {
	return buildConfigIdTransactionTool(input, 'plinko');
}

export function buildWheelTransactionTool(input: ConfigIdInput = {}): Promise<ToolTextResult> {
	return buildConfigIdTransactionTool(input, 'wheel');
}

export async function buildRangeTransactionTool(input: RangeInput = {}): Promise<ToolTextResult> {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'range',
				requiredInputs: ['owner', 'stake', 'leftPoint', 'rightPoint'],
				notes: ['Range points are normalized by @suigar/sdk before Move call construction.'],
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
			bundle.client.suigar.tx.createGameBet({
				game: 'range',
				...(await stakeOptions(input, bundle)),
				leftPoint,
				rightPoint,
				outOfRange,
			}),
	});
}

export async function buildSoccerTransactionTool(input: SoccerInput = {}): Promise<ToolTextResult> {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'soccer',
				requiredInputs: ['owner', 'stake', 'configId', 'countryId', 'shotZoneId'],
				notes: ['Config, country, and shot zone ids select the on-chain Soccer game settings.'],
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
			bundle.client.suigar.tx.createGameBet({
				game: 'soccer',
				...(await stakeOptions(input, bundle)),
				configId,
				countryId,
				shotZoneId,
			}),
	});
}

export async function buildPvpCoinflipCreateTransactionTool(
	input: PvpCoinflipCreateInput = {},
): Promise<ToolTextResult> {
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

	const creatorSide = requireString(input.creatorSide, 'creatorSide') as CoinSide;
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
}

export async function buildPvpCoinflipJoinTransactionTool(
	input: PvpCoinflipJoinInput = {},
): Promise<ToolTextResult> {
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
}

export async function buildPvpCoinflipCancelTransactionTool(
	input: PvpCoinflipCancelInput = {},
): Promise<ToolTextResult> {
	if (getMode(input.mode) === 'read-only') {
		return asTextResponse(
			readOnlyPlan({
				input,
				game: 'pvp-coinflip',
				action: 'cancel',
				requiredInputs: ['owner', 'gameId'],
				notes: ['Cancel only prepares the unsigned cancellation transaction for the game creator.'],
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
}

const BET_COUNT_LIMITS: Partial<Record<Game, { parameter: string; label: string }>> = {
	limbo: { parameter: 'max_number_of_games', label: 'games' },
	plinko: { parameter: 'max_number_of_balls', label: 'balls' },
	range: { parameter: 'max_number_of_games', label: 'games' },
	soccer: { parameter: 'max_number_of_shots', label: 'shots' },
	wheel: { parameter: 'max_number_of_spins', label: 'spins' },
};
export function toPositiveInteger(value: unknown, fieldName: string): number | bigint {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
		return value;
	}
	if (typeof value === 'string' && POSITIVE_INTEGER_PATTERN.test(value)) {
		return BigInt(value);
	}
	throw new TypeError(`Missing or invalid ${fieldName}. Provide a positive integer.`);
}
export function requireNumber(value: unknown, fieldName: string): number {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	throw new TypeError(`Missing or invalid numeric field: ${fieldName}.`);
}
function getTarget(config: McpConfig, game: Game, action?: PvPCoinflipAction): string {
	const packageId = getPackageId(config, game);
	if (game === 'pvp-coinflip') {
		const functionName = `${action?.toLowerCase() ?? 'create'}_game`;
		return `${packageId}::${game}::${functionName}`;
	}
	return `${packageId}::${game}::play`;
}
export function readOnlyPlan({
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
}): ReadOnlyPlan {
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
}

async function gameTransactionOptions(
	input: TransactionToolInput,
	bundle: SuigarClientBundle,
): Promise<
	Required<Pick<TransactionToolInput, 'owner' | 'coinType'>> &
		Pick<TransactionToolInput, 'metadata' | 'gasBudget' | 'useGasCoin'>
> {
	const sessionExecution = getMode(input.mode) === 'execute' && input.executionWallet === 'session';
	let owner: string;
	if (sessionExecution) {
		const sessionWallet = await loadSessionWallet(input.sessionWalletId);
		if (!sessionWallet) {
			throw new Error(
				'No session wallet exists. Call "setup_session_wallet" first, then fund its address before executing games.',
			);
		}
		const sessionAddress = (await loadSessionSigner(input.sessionWalletId)).toSuiAddress();
		if (sessionWallet.address !== sessionAddress) {
			throw new Error(
				'The saved session wallet address does not match its keychain signer. Recover the intended wallet with "setup_session_wallet" before executing games.',
			);
		}
		if (input.owner) {
			const requestedOwner = await resolveOwnerAddress(input.owner, bundle);
			if (requestedOwner !== sessionAddress) {
				throw new RangeError(
					'owner must match the local session wallet address when executionWallet is "session".',
				);
			}
		}
		owner = sessionAddress;
	} else {
		owner = await resolveOwnerAddress(requireString(input.owner, 'owner'), bundle);
	}
	return {
		owner,
		coinType: resolveDefaultCoinType(bundle.config, input.coinType),
		metadata: input.metadata,
		gasBudget: input.gasBudget,
		useGasCoin: input.useGasCoin,
	};
}

async function enforceBetCountLimit(
	game: Game,
	input: TransactionToolInput,
	bundle: SuigarClientBundle,
): Promise<void> {
	if (!('betCount' in input) || input.betCount == null) {
		return;
	}

	const limit = BET_COUNT_LIMITS[game];
	if (!limit) {
		return;
	}

	const requested = BigInt(toPositiveInteger(input.betCount, 'betCount'));
	const parameters = await bundle.client.suigar.getGameParameters({
		game,
		coinType: resolveDefaultCoinType(bundle.config, input.coinType),
	});
	const max = (parameters as Record<string, unknown>)[limit.parameter];
	if (
		(typeof max !== 'bigint' && typeof max !== 'number' && typeof max !== 'string') ||
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
}

export async function stakeOptions(
	input: StandardTransactionToolInput,
	bundle: SuigarClientBundle,
): Promise<
	Required<Pick<TransactionToolInput, 'owner' | 'coinType'>> &
		Pick<TransactionToolInput, 'metadata' | 'gasBudget' | 'useGasCoin'> & {
			betCount?: number | bigint;
			cashStake?: bigint;
			stake: bigint;
		}
> {
	const { decimals } = coinMetadataForAmount(bundle.config, input.coinType);
	return {
		...(await gameTransactionOptions(input, bundle)),
		stake: toBaseUnits(input.stake, 'stake', decimals),
		...(input.cashStake == null
			? {}
			: {
					cashStake: toBaseUnits(input.cashStake, 'cashStake', decimals),
				}),
		...(input.betCount == null ? {} : { betCount: toPositiveInteger(input.betCount, 'betCount') }),
	};
}

export async function buildTransactionTool({
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
	>): Promise<ToolTextResult> {
	const mode = getMode(input.mode);
	if (mode === 'read-only') {
		throw new Error('read-only mode must be handled before transaction execution.');
	}

	const bundle = createSuigarClient(getConfigInput(input));
	await enforceBetCountLimit(game, input, bundle);
	const coin = coinMetadataForAmount(bundle.config, input.coinType);
	const baseStake =
		stake ?? (stakeDisplay == null ? undefined : toBaseUnits(stakeDisplay, 'stake', coin.decimals));
	const transaction = await createTransaction(bundle);
	const context = {
		game,
		action,
		coinType: coin.coinType,
		stake: baseStake,
		stakeDisplay,
		coinDecimals: coin.decimals,
		gasBudget: input.gasBudget,
		gameInputs,
	};
	if (mode === 'execute') {
		if (input.executionWallet === 'session') {
			const built = await buildTransactionResult({
				mode: 'build',
				transaction,
				config: bundle.config,
				client: bundle.client,
				context,
			});
			const execution = await executeSessionTransaction({
				transaction,
				client: bundle.client,
				signer: await loadSessionSigner(input.sessionWalletId),
			});
			return asTextResponse({
				mode: 'execute',
				network: bundle.config.network,
				config: bundle.config,
				summary: built.summary,
				execution: { wallet: 'session', ...execution },
			});
		}
		const built = await buildTransactionResult({
			mode: 'build',
			transaction,
			config: bundle.config,
			client: bundle.client,
			context,
		});
		const execution = await createExecutionBridge({
			network: bundle.config.network,
			webOrigin: resolveWebOrigin(bundle.config.network),
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
			context,
		}),
	);
}
