// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@mysten/sui/transactions';
import {
	buildTransactionResult,
	createSuigarClient,
	resolveDefaultCoinType,
} from './client.js';
import type {
	CoinflipInput,
	ConfigIdInput,
	LimboInput,
	PvpCoinflipCancelInput,
	PvpCoinflipCreateInput,
	PvpCoinflipJoinInput,
	RangeInput,
	ReadConfigInput,
	ReadGameMetadataInput,
} from './schemas.js';
import type {
	BuilderMode,
	PvpCoinflipAction,
	ReadConfigResult,
	ReadGameMetadataResult,
	ReadOnlyPlan,
	ResolvedMcpConfig,
	SupportedGameId,
	ToolTextResult,
} from './types.js';

const GAME_LABELS = {
	coinflip: 'Coinflip',
	limbo: 'Limbo',
	plinko: 'Plinko',
	range: 'Range',
	wheel: 'Wheel',
	'pvp-coinflip': 'PvP Coinflip',
} as const satisfies Record<SupportedGameId, string>;

const GAME_TO_PACKAGE_KEY = {
	coinflip: 'coinflip',
	limbo: 'limbo',
	plinko: 'plinko',
	range: 'range',
	wheel: 'wheel',
	'pvp-coinflip': 'pvpCoinflip',
} as const satisfies Record<
	SupportedGameId,
	keyof ResolvedMcpConfig['sdk']['packageIds']
>;

const GAME_TO_TOOLS = {
	coinflip: ['suigar_build_coinflip_transaction'],
	limbo: ['suigar_build_limbo_transaction'],
	plinko: ['suigar_build_plinko_transaction'],
	range: ['suigar_build_range_transaction'],
	wheel: ['suigar_build_wheel_transaction'],
	'pvp-coinflip': [
		'suigar_build_pvp_coinflip_create_transaction',
		'suigar_build_pvp_coinflip_join_transaction',
		'suigar_build_pvp_coinflip_cancel_transaction',
	],
} as const satisfies Record<SupportedGameId, readonly string[]>;

const json = (value: unknown) =>
	JSON.stringify(
		value,
		(_key, item) => (typeof item === 'bigint' ? item.toString() : item),
		2,
	);

const asTextResponse = <T extends ToolTextResult['structuredContent']>(
	structuredContent: T,
): ToolTextResult => ({
	content: [{ type: 'text', text: json(structuredContent) }],
	structuredContent,
});

const toAmount = (value: unknown, fieldName: string): number | bigint => {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) {
		return value;
	}
	if (typeof value === 'bigint' && value >= 0n) {
		return value;
	}
	if (typeof value === 'string' && /^\d+$/u.test(value)) {
		return BigInt(value);
	}
	throw new TypeError(
		`Missing or invalid ${fieldName}. Provide a non-negative integer in base units.`,
	);
};

const toPositiveAmount = (
	value: unknown,
	fieldName: string,
): number | bigint => {
	const amount = toAmount(value, fieldName);
	if (BigInt(amount) <= 0n) {
		throw new RangeError(`${fieldName} must be greater than zero.`);
	}
	return amount;
};

const requireString = (value: unknown, fieldName: string): string => {
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	throw new TypeError(`Missing required field: ${fieldName}.`);
};

const requireNumber = (value: unknown, fieldName: string): number => {
	if (typeof value === 'number' && Number.isFinite(value)) {
		return value;
	}
	throw new TypeError(`Missing or invalid numeric field: ${fieldName}.`);
};

const getMode = (mode: BuilderMode | undefined): BuilderMode => mode ?? 'build';

const getConfigInput = (input: ReadConfigInput) => ({
	network: input.network,
	providerUrl: input.providerUrl,
	config: input.config,
	partner: input.partner,
});

const supportedGames = () =>
	(Object.keys(GAME_LABELS) as SupportedGameId[]).map((id) => ({
		id,
		label: GAME_LABELS[id],
		tools: [...GAME_TO_TOOLS[id]],
	}));

const getPackageId = (config: ResolvedMcpConfig, game: SupportedGameId) =>
	config.sdk.packageIds[GAME_TO_PACKAGE_KEY[game]];

const getTarget = (
	config: ResolvedMcpConfig,
	game: SupportedGameId,
	action?: PvpCoinflipAction,
) => {
	const packageId = getPackageId(config, game);
	if (game === 'pvp-coinflip') {
		const functionName =
			action === 'join'
				? 'join_game'
				: action === 'cancel'
					? 'cancel_game'
					: 'create_game';
		return `${packageId}::pvp_coinflip::${functionName}`;
	}
	return `${packageId}::${game}::play`;
};

const readOnlyPlan = ({
	input,
	game,
	action,
	requiredInputs,
	notes,
}: {
	input:
		| CoinflipInput
		| LimboInput
		| ConfigIdInput
		| RangeInput
		| PvpCoinflipCreateInput
		| PvpCoinflipJoinInput
		| PvpCoinflipCancelInput;
	game: SupportedGameId;
	action?: PvpCoinflipAction;
	requiredInputs: string[];
	notes: string[];
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

const commonOptions = (
	input:
		| CoinflipInput
		| LimboInput
		| ConfigIdInput
		| RangeInput
		| PvpCoinflipCreateInput
		| PvpCoinflipJoinInput
		| PvpCoinflipCancelInput,
) => {
	const { config } = createSuigarClient(getConfigInput(input));
	return {
		owner: requireString(input.owner, 'owner'),
		coinType: resolveDefaultCoinType(config, input.coinType),
		metadata: input.metadata,
		gasBudget: input.gasBudget,
		useGasCoin: input.useGasCoin,
	};
};

const stakeOptions = (
	input: CoinflipInput | LimboInput | ConfigIdInput | RangeInput,
) => ({
	...commonOptions(input),
	stake: toAmount(input.stake, 'stake'),
	...(input.cashStake == null
		? {}
		: { cashStake: toAmount(input.cashStake, 'cashStake') }),
	...(input.betCount == null
		? {}
		: { betCount: toPositiveAmount(input.betCount, 'betCount') }),
});

const executeTransactionTool = async ({
	input,
	game,
	action,
	createTransaction,
	stake,
}: {
	input:
		| CoinflipInput
		| LimboInput
		| ConfigIdInput
		| RangeInput
		| PvpCoinflipCreateInput
		| PvpCoinflipJoinInput
		| PvpCoinflipCancelInput;
	game: SupportedGameId;
	action?: PvpCoinflipAction;
	createTransaction: (
		bundle: ReturnType<typeof createSuigarClient>,
	) => Transaction;
	stake?: number | bigint;
}) => {
	const mode = getMode(input.mode);
	if (mode === 'read-only') {
		throw new Error(
			'read-only mode must be handled before transaction execution.',
		);
	}

	const bundle = createSuigarClient(getConfigInput(input));
	const transaction = createTransaction(bundle);
	return asTextResponse(
		await buildTransactionResult({
			mode,
			transaction,
			config: bundle.config,
			client: bundle.rawClient,
			context: {
				game,
				action,
				coinType: resolveDefaultCoinType(bundle.config, input.coinType),
				stake,
			},
		}),
	);
};

export const readConfigTool = async (input: ReadConfigInput = {}) => {
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
	} satisfies ReadConfigResult);
};

export const readGameMetadataTool = async (
	input: ReadGameMetadataInput = {},
) => {
	const { config } = createSuigarClient(getConfigInput(input));
	const game = input.game ?? null;
	const coinType = resolveDefaultCoinType(config, input.coinType);
	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
		game: game
			? {
					id: game,
					label: GAME_LABELS[game],
					packageId: getPackageId(config, game),
					coinType,
					notes: [
						game === 'pvp-coinflip'
							? 'PvP coinflip uses dedicated create, join, and cancel transaction builders.'
							: 'Standard games use client.suigar.tx.createBetTransaction().',
						'Transactions are unsigned and are never executed by the MCP server.',
					],
				}
			: null,
	} satisfies ReadGameMetadataResult);
};

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

	return executeTransactionTool({
		input,
		game: 'coinflip',
		stake: toAmount(input.stake, 'stake'),
		createTransaction: ({ client }) =>
			client.suigar.tx.createBetTransaction('coinflip', {
				...stakeOptions(input),
				side: requireString(input.side, 'side') as 'heads' | 'tails',
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

	return executeTransactionTool({
		input,
		game: 'limbo',
		stake: toAmount(input.stake, 'stake'),
		createTransaction: ({ client }) =>
			client.suigar.tx.createBetTransaction('limbo', {
				...stakeOptions(input),
				targetMultiplier: requireNumber(
					input.targetMultiplier,
					'targetMultiplier',
				),
			}),
	});
};

const buildConfigIdTransactionTool = async (
	input: ConfigIdInput,
	game: 'plinko' | 'wheel',
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

	return executeTransactionTool({
		input,
		game,
		stake: toAmount(input.stake, 'stake'),
		createTransaction: ({ client }) =>
			client.suigar.tx.createBetTransaction(game, {
				...stakeOptions(input),
				configId: requireNumber(input.configId, 'configId'),
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

	return executeTransactionTool({
		input,
		game: 'range',
		stake: toAmount(input.stake, 'stake'),
		createTransaction: ({ client }) =>
			client.suigar.tx.createBetTransaction('range', {
				...stakeOptions(input),
				leftPoint: requireNumber(input.leftPoint, 'leftPoint'),
				rightPoint: requireNumber(input.rightPoint, 'rightPoint'),
				outOfRange: Boolean(input.outOfRange),
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

	return executeTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'create',
		stake: toAmount(input.stake, 'stake'),
		createTransaction: ({ client }) =>
			client.suigar.tx.createPvPCoinflipTransaction('create', {
				...commonOptions(input),
				config: client.suigar.getConfig(),
				stake: toAmount(input.stake, 'stake'),
				side: requireString(input.creatorSide, 'creatorSide') as
					'heads' | 'tails',
				isPrivate: input.isPrivate,
			}),
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

	return executeTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'join',
		createTransaction: ({ client }) =>
			client.suigar.tx.createPvPCoinflipTransaction('join', {
				...commonOptions(input),
				config: client.suigar.getConfig(),
				gameId: requireString(input.gameId, 'gameId'),
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

	return executeTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'cancel',
		createTransaction: ({ client }) =>
			client.suigar.tx.createPvPCoinflipTransaction('cancel', {
				...commonOptions(input),
				config: client.suigar.getConfig(),
				gameId: requireString(input.gameId, 'gameId'),
			}),
	});
};
