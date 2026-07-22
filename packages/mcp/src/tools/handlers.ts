// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
import {
	GAMES,
	type CoinSide,
	type Game,
	type PvPCoinflipAction,
	type StandardGame,
} from '@suigar/sdk/games';
import { formatBaseUnitAmount } from '../runtime/format.js';
import {
	buildTransactionResult,
	createSuigarClient,
	DEFAULT_NETWORK,
	resolveDefaultCoinType,
	resolveOwnerAddress,
	toJsonValue,
	ToolTextResult,
	type BuilderMode,
	type ListNftsResult,
	type ReadConfigResult,
	type ReadGameMetadataResult,
	type ReadOnlyPlan,
	type ResolvedMcpConfig,
	type SuigarClientBundle,
	type TransactionSummaryContext,
} from '../runtime/index.js';
import type {
	CoinflipInput,
	ConfigIdInput,
	LimboInput,
	ListNftsInput,
	PvpCoinflipCancelInput,
	PvpCoinflipCreateInput,
	PvpCoinflipJoinInput,
	RangeInput,
	ReadConfigInput,
	ReadGameMetadataInput,
	SoccerInput,
} from './schemas.js';

type TransactionToolInput =
	| CoinflipInput
	| LimboInput
	| ConfigIdInput
	| RangeInput
	| SoccerInput
	| PvpCoinflipCreateInput
	| PvpCoinflipJoinInput
	| PvpCoinflipCancelInput;

type StandardTransactionToolInput =
	CoinflipInput | LimboInput | ConfigIdInput | RangeInput | SoccerInput;

const GAME_LABELS = {
	coinflip: 'Coinflip',
	limbo: 'Limbo',
	plinko: 'Plinko',
	range: 'Range',
	soccer: 'Soccer',
	wheel: 'Wheel',
	'pvp-coinflip': 'PvP Coinflip',
} as const satisfies Record<Game, string>;

const GAME_TO_PACKAGE_KEY = {
	coinflip: 'coinflip',
	limbo: 'limbo',
	plinko: 'plinko',
	range: 'range',
	soccer: 'soccer',
	wheel: 'wheel',
	'pvp-coinflip': 'pvpCoinflip',
} as const satisfies Record<Game, keyof ResolvedMcpConfig['sdk']['packageIds']>;

const GAME_TO_TOOLS = {
	coinflip: ['build_coinflip_transaction'],
	limbo: ['build_limbo_transaction'],
	plinko: ['build_plinko_transaction'],
	range: ['build_range_transaction'],
	soccer: ['build_soccer_transaction'],
	wheel: ['build_wheel_transaction'],
	'pvp-coinflip': [
		'build_pvp_coinflip_create_transaction',
		'build_pvp_coinflip_join_transaction',
		'build_pvp_coinflip_cancel_transaction',
	],
} as const satisfies Record<Game, readonly string[]>;

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

const currencyAmountPattern = /^(?:\d+|\d+\.\d+|\.\d+)$/u;

const coinMetadataForAmount = (
	config: ResolvedMcpConfig,
	coinType?: string,
) => {
	const resolvedCoinType = resolveDefaultCoinType(config, coinType);
	const coin = Object.values(config.sdk.coins).find(
		(metadata) =>
			resolveDefaultCoinType(config, metadata.coinType) === resolvedCoinType,
	);

	if (!coin) {
		throw new RangeError(
			`Unable to resolve decimals for coin type ${resolvedCoinType}. Add the coin to config.coins before using currency-denominated amounts.`,
		);
	}

	return {
		coinType: resolvedCoinType,
		decimals: coin.decimals,
	};
};

const toCurrencyAmountText = (value: unknown, fieldName: string): string => {
	if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
		return String(value);
	}
	if (typeof value === 'string' && currencyAmountPattern.test(value.trim())) {
		return value.trim();
	}
	throw new TypeError(
		`Missing or invalid ${fieldName}. Provide a non-negative currency amount such as 1, 2, or 1.5.`,
	);
};

const toBaseUnits = (
	value: unknown,
	fieldName: string,
	decimals: number,
): bigint => {
	const amount = toCurrencyAmountText(value, fieldName);
	const [rawWhole, rawFraction = ''] = amount.split('.');
	const whole = rawWhole === '' ? '0' : rawWhole;
	const overflow = rawFraction.slice(decimals);
	if (/[^0]/u.test(overflow)) {
		throw new RangeError(
			`${fieldName} has more fractional digits than the configured coin decimals (${decimals}).`,
		);
	}
	const fraction = rawFraction.slice(0, decimals).padEnd(decimals, '0');
	return BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction || '0');
};

const toPositiveInteger = (
	value: unknown,
	fieldName: string,
): number | bigint => {
	if (typeof value === 'number' && Number.isSafeInteger(value) && value > 0) {
		return value;
	}
	if (typeof value === 'string' && /^[1-9]\d*$/u.test(value)) {
		return BigInt(value);
	}
	throw new TypeError(
		`Missing or invalid ${fieldName}. Provide a positive integer.`,
	);
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

const requireGame = (value: unknown): Game => {
	const game = requireString(value, 'game');
	if (GAMES.includes(game as Game)) {
		return game as Game;
	}
	throw new RangeError(
		`Unsupported game: ${game}. Use one of: ${GAMES.join(', ')}.`,
	);
};

const isAmountParameter = (key: string) =>
	key === 'min_stake' || key === 'max_stake' || key === 'max_payout';

const formatGameParameterValue = (
	key: string,
	value: unknown,
	decimals: number,
): unknown => {
	if (Array.isArray(value)) {
		return value.map((item) => formatGameParameterValue(key, item, decimals));
	}
	if (value && typeof value === 'object') {
		return formatGameParameters(value as Record<string, unknown>, decimals);
	}
	return isAmountParameter(key) &&
		(typeof value === 'string' ||
			typeof value === 'number' ||
			typeof value === 'bigint')
		? {
				raw: String(value),
				display: formatBaseUnitAmount(value, decimals),
			}
		: value;
};

const formatGameParameters = (
	parameters: Record<string, unknown>,
	decimals: number,
) => {
	const formatted: Record<
		string,
		ReturnType<typeof formatGameParameterValue>
	> = {};
	for (const key of Object.keys(parameters)) {
		formatted[key] = formatGameParameterValue(key, parameters[key], decimals);
	}
	return formatted;
};

const getMode = (mode: BuilderMode | undefined): BuilderMode => mode ?? 'build';

const getConfigInput = (input: ReadConfigInput) => ({
	network: input.network ?? DEFAULT_NETWORK,
	providerUrl: input.providerUrl,
	config: input.config,
	partner: input.partner,
});

const supportedGames = () =>
	GAMES.map((id) => ({
		id,
		label: GAME_LABELS[id],
		tools: [...GAME_TO_TOOLS[id]],
	}));

const getPackageId = (config: ResolvedMcpConfig, game: Game) =>
	config.sdk.packageIds[GAME_TO_PACKAGE_KEY[game]];

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

const readOnlyPlan = ({
	input,
	game,
	action,
	requiredInputs,
	notes,
}: {
	input: TransactionToolInput;
	game: Game;
	action?: PvPCoinflipAction;
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

const commonOptions = async (
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

const stakeOptions = async (
	input: StandardTransactionToolInput,
	bundle: SuigarClientBundle,
) => {
	const { decimals } = coinMetadataForAmount(bundle.config, input.coinType);
	return {
		...(await commonOptions(input, bundle)),
		stake: toBaseUnits(input.stake, 'stake', decimals),
		...(input.cashStake == null
			? {}
			: { cashStake: toBaseUnits(input.cashStake, 'cashStake', decimals) }),
		...(input.betCount == null
			? {}
			: { betCount: toPositiveInteger(input.betCount, 'betCount') }),
	};
};

const executeTransactionTool = async ({
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
	const coin = coinMetadataForAmount(bundle.config, input.coinType);
	const baseStake =
		stake ??
		(stakeDisplay == null
			? undefined
			: toBaseUnits(stakeDisplay, 'stake', coin.decimals));
	const transaction = await createTransaction(bundle);
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

export const readConfigTool = async (input: ReadConfigInput = {}) => {
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
	} satisfies ReadConfigResult);
};

export const readGameMetadataTool = async (
	input: Partial<ReadGameMetadataInput> = {},
) => {
	const game = requireGame(input.game);
	const { client, config } = createSuigarClient(getConfigInput(input));
	const coin = coinMetadataForAmount(config, input.coinType);
	const ignoreCache = input.ignoreCache ?? true;
	const parameters = await client.suigar.getGameParameters(game, {
		coinType: coin.coinType,
		ignoreCache,
	});

	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
		game: {
			id: game,
			label: GAME_LABELS[game],
			packageId: getPackageId(config, game),
			coinType: coin.coinType,
			parameters:
				toJsonValue(formatGameParameters(parameters, coin.decimals)) ?? null,
			ignoreCache,
			notes: [
				'Parameters are loaded from the on-chain game settings objects through client.suigar.getGameParameters().',
				ignoreCache
					? 'SDK parameter cache was ignored for this read.'
					: 'SDK parameter cache was allowed for this read.',
			],
		},
	} satisfies ReadGameMetadataResult);
};

export const listNftsTool = async (input: Partial<ListNftsInput> = {}) => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(
		requireString(input.owner, 'owner'),
		bundle,
	);
	const { client, config } = bundle;
	const nftType = `${config.sdk.packageIds.legacyNft}::nft::Nft`;
	const factory = await client.core.getObject({
		objectId: config.sdk.objectIds.legacyNftFactory,
		include: { content: true },
	});
	const catalog = client.suigar.bcs.LegacyNftFactory.parse(
		factory.object.content,
	);
	const ownedNfts = [] as ListNftsResult['ownedNfts'];
	let cursor: string | null = null;

	do {
		const page: SuiClientTypes.ListOwnedObjectsResponse<{ content: true }> =
			await client.core.listOwnedObjects<{ content: true }>({
				owner,
				type: nftType,
				cursor,
				include: { content: true },
			});
		for (const object of page.objects) {
			const nft = client.suigar.bcs.LegacyNft.parse(object.content);
			ownedNfts.push({
				id: nft.id,
				specId: nft.spec_id,
				name: nft.name,
				description: nft.description,
				url: nft.url.url,
				imageUrl: nft.image_url.url,
			});
		}
		cursor = page.cursor;
	} while (cursor);

	return asTextResponse({
		network: config.network,
		config,
		owner,
		nftType,
		nftCatalog: catalog.specs.contents.map(({ value }) => ({
			id: value.id,
			name: value.name,
			description: value.description,
			url: value.url.url,
			supply: value.supply.toString(),
			available: value.available.toString(),
			price: value.price.toString(),
			priceDisplay: formatBaseUnitAmount(value.price),
		})),
		ownedNfts,
	} satisfies ListNftsResult);
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

	const side = requireString(input.side, 'side') as CoinSide;
	return executeTransactionTool({
		input,
		game: 'coinflip',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { side },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createBetTransaction('coinflip', {
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
	return executeTransactionTool({
		input,
		game: 'limbo',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { targetMultiplier },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createBetTransaction('limbo', {
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
	return executeTransactionTool({
		input,
		game,
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { configId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createBetTransaction(game, {
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
	return executeTransactionTool({
		input,
		game: 'range',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { leftPoint, rightPoint, outOfRange },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createBetTransaction('range', {
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
	return executeTransactionTool({
		input,
		game: 'soccer',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: { configId, countryId, shotZoneId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createBetTransaction('soccer', {
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
	return executeTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'create',
		stakeDisplay: toCurrencyAmountText(input.stake, 'stake'),
		gameInputs: {
			creatorSide,
			...(input.isPrivate == null ? {} : { isPrivate: input.isPrivate }),
		},
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createPvPCoinflipTransaction('create', {
				...(await commonOptions(input, bundle)),
				stake: toBaseUnits(
					input.stake,
					'stake',
					coinMetadataForAmount(bundle.config, input.coinType).decimals,
				),
				side: creatorSide,
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

	const gameId = requireString(input.gameId, 'gameId');
	return executeTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'join',
		gameInputs: { gameId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createPvPCoinflipTransaction('join', {
				...(await commonOptions(input, bundle)),
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
	return executeTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'cancel',
		gameInputs: { gameId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.createPvPCoinflipTransaction('cancel', {
				...(await commonOptions(input, bundle)),
				gameId,
			}),
	});
};
