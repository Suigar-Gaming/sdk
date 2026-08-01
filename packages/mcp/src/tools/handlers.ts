// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@mysten/sui/transactions';
import { parseStructTag } from '@mysten/sui/utils';
import {
	GAMES,
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
	toJsonValue,
	type BuilderMode,
	type ListNftsResult,
	type ReadConfigResult,
	type ReadGameMetadataResult,
	type ReadOnlyPlan,
	type ReferralClaimKind,
	type ReferralClaimReadOnlyPlan,
	type ReferralClaimReadResult,
	type ResolvedMcpConfig,
	type SuigarClientBundle,
	type ToolTextResult,
	type TransactionSummaryContext,
} from '../runtime/index.js';
import {
	BASE_UNIT_AMOUNT_PATTERN,
	formatBaseUnitAmount,
	POSITIVE_INTEGER_PATTERN,
	toBaseUnits,
	toCurrencyAmountText,
} from '../utils/index.js';
import {
	createExecutionBridge,
	createLoginBridge,
	getExecutionStatus,
	loadCredentials,
	removeProfile,
} from '../wallet/index.js';
import type {
	BuildReferralCommissionClaimTransactionInput,
	BuildReferralLevelUpUsdRewardsClaimTransactionInput,
	CoinflipInput,
	ConfigIdInput,
	ConnectionInput,
	GetExecutionStatusInput,
	GetReferralCommissionInput,
	GetReferralLevelUpUsdRewardsInput,
	GetWalletBalancesInput,
	LimboInput,
	ListNftsInput,
	ListWalletCoinsInput,
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
} as const satisfies Record<Game, ReadonlyArray<string>>;

const BET_COUNT_LIMITS: Partial<
	Record<Game, { parameter: string; label: string }>
> = {
	limbo: { parameter: 'max_number_of_games', label: 'games' },
	plinko: { parameter: 'max_number_of_balls', label: 'balls' },
	range: { parameter: 'max_number_of_games', label: 'games' },
	soccer: { parameter: 'max_number_of_shots', label: 'shots' },
	wheel: { parameter: 'max_number_of_spins', label: 'spins' },
};

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

const toPositiveInteger = (
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

const frontendOriginFor = (network: 'mainnet' | 'testnet') =>
	process.env.SUIGAR_MCP_WEB_URL ??
	(network === 'mainnet' ? 'https://suigar.com' : 'https://testnet.suigar.com');

const getConfigInput = (input: ReadConfigInput) => ({
	network: input.network,
	providerUrl: input.providerUrl,
	config: input.config,
	partner: input.partner,
});

const coinSymbol = (coinType: string) => {
	try {
		return parseStructTag(coinType).name;
	} catch {
		return coinType;
	}
};

const resolveCoinDisplayMetadata = async (
	coinType: string,
	bundle: SuigarClientBundle,
) => {
	const configuredCoin = Object.values(bundle.config.sdk.coins).find(
		(coin) => coin.coinType === coinType,
	);
	if (configuredCoin) {
		return {
			decimals: configuredCoin.decimals,
			symbol: coinSymbol(coinType),
		};
	}

	try {
		const { coinMetadata } = await bundle.client.core.getCoinMetadata({
			coinType,
		});
		if (coinMetadata) {
			return {
				decimals: coinMetadata.decimals,
				symbol: coinMetadata.symbol || coinSymbol(coinType),
			};
		}
	} catch {
		// A missing metadata object should not prevent the wallet from being read.
	}

	return { decimals: undefined, symbol: coinSymbol(coinType) };
};

const resolveWalletOwner = async (
	input: { owner?: string; network?: 'mainnet' | 'testnet' },
	bundle: SuigarClientBundle,
) => {
	if (input.owner) return await resolveOwnerAddress(input.owner, bundle);
	const credentials = await loadCredentials();
	const profile = credentials.profiles[bundle.config.network];
	if (!profile)
		throw new Error(
			`No wallet is connected for ${bundle.config.network}. Call suigar_login first.`,
		);
	return profile.address;
};

export const getWalletBalancesTool = async (
	input: GetWalletBalancesInput,
): Promise<ToolTextResult> => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveWalletOwner(input, bundle);
	const balances = [];
	let cursor: string | null = null;
	let hasNextPage = false;
	do {
		const result = await bundle.client.core.listBalances({ owner, cursor });
		balances.push(...result.balances);
		cursor = result.cursor;
		hasNextPage = result.hasNextPage;
	} while (hasNextPage && cursor);

	const metadata = new Map(
		await Promise.all(
			balances.map(
				async (balance) =>
					[
						balance.coinType,
						await resolveCoinDisplayMetadata(balance.coinType, bundle),
					] as const,
			),
		),
	);
	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		wallet: {
			owner,
			balances: balances.map((balance) => {
				const coin = metadata.get(balance.coinType)!;
				return {
					...balance,
					balanceDisplay: formatBaseUnitAmount(balance.balance, coin.decimals),
					symbol: coin.symbol,
				};
			}),
		},
	});
};

export const listWalletCoinsTool = async (
	input: ListWalletCoinsInput,
): Promise<ToolTextResult> => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveWalletOwner(input, bundle);

	const result = await bundle.client.core.listCoins({
		owner,
		coinType: input.coinType,
		cursor: input.cursor,
		limit: input.limit ?? 50,
	});
	const metadata = await resolveCoinDisplayMetadata(
		input.coinType ?? bundle.config.sdk.coins.sui.coinType,
		bundle,
	);
	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		wallet: {
			owner,
			coins: result.objects.map((coin) => {
				return {
					...coin,
					balanceDisplay: formatBaseUnitAmount(coin.balance, metadata.decimals),
					symbol: metadata.symbol,
				};
			}),
			nextCursor: result.cursor,
			hasNextPage: result.hasNextPage,
		},
	});
};

export const getExecutionStatusTool = async (
	input: GetExecutionStatusInput,
): Promise<ToolTextResult> => {
	const execution = getExecutionStatus(input.requestId);
	if (!execution)
		throw new Error(
			'Unknown execution request. It may have expired or this MCP server restarted.',
		);
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({ network: config.network, config, execution });
};

export const getConnectionStatusTool = async (
	input: ConnectionInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	const profile = (await loadCredentials()).profiles[config.network];
	return asTextResponse({
		network: config.network,
		config,
		connection: profile
			? {
					connected: true,
					address: profile.address,
					walletType: profile.walletType,
					status: 'connected',
				}
			: { connected: false, status: 'logged-out' },
	});
};

export const suigarLoginTool = async (
	input: ConnectionInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	const bridge = await createLoginBridge({
		network: config.network,
		frontendOrigin: frontendOriginFor(config.network),
	});
	void bridge.done.catch(() => undefined);
	return asTextResponse({
		network: config.network,
		config,
		connection: { connected: false, loginUrl: bridge.url, status: 'pending' },
	});
};

export const suigarLogoutTool = async (
	input: ConnectionInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	await removeProfile(config.network);
	return asTextResponse({
		network: config.network,
		config,
		connection: { connected: false, status: 'logged-out' },
	});
};

const supportedGames = () =>
	GAMES.map((id) => ({
		id,
		label: GAME_LABELS[id],
		tools: [...GAME_TO_TOOLS[id]],
	}));

const supportedFeatures = () => [
	{
		id: 'nfts' as const,
		label: 'NFTs',
		tools: ['list_nfts'],
	},
	{
		id: 'referrals' as const,
		label: 'Referrals',
		tools: [
			'get_referral_commission',
			'get_referral_level_up_usd_rewards',
			'build_referral_commission_claim_transaction',
			'build_referral_level_up_usd_rewards_claim_transaction',
		],
	},
];

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

const referralClaimTarget = (
	config: ResolvedMcpConfig,
	kind: ReferralClaimKind,
) =>
	`${config.sdk.packageIds.referral}::referral::${
		kind === 'commission'
			? 'claim_commission_balance'
			: 'claim_referrer_level_up_usd_rewards'
	}`;

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
			: {
					cashStake: toBaseUnits(input.cashStake, 'cashStake', decimals),
				}),
		...(input.betCount == null
			? {}
			: { betCount: toPositiveInteger(input.betCount, 'betCount') }),
	};
};

const buildTransactionTool = async ({
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
			frontendOrigin: frontendOriginFor(bundle.config.network),
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

export const readConfigTool = async (input: ReadConfigInput = {}) => {
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
		supportedFeatures: supportedFeatures(),
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
		supportedFeatures: supportedFeatures(),
		game: {
			id: game,
			label: GAME_LABELS[game],
			packageId: getPackageId(config, game),
			coinType: coin.coinType,
			parameters:
				toJsonValue(formatGameParameters(parameters, coin.decimals)) ?? null,
			ignoreCache,
			notes: [
				'Parameters are loaded for the requested coin type from the on-chain game settings objects through client.suigar.getGameParameters().',
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
	const nftType = client.suigar.bcs.NftV1.typeTag({
		package: config.sdk.packageIds.nftV1,
	});
	const factory = await client.core.getObject({
		objectId: config.sdk.objectIds.nftV1Factory,
		include: { content: true },
	});
	const catalog = client.suigar.bcs.NftV1Factory.parse(factory.object.content);
	const ownedNfts = [] as ListNftsResult['ownedNfts'];
	let cursor: string | null | undefined;

	do {
		const page = await client.core.listOwnedObjects({
			owner,
			type: nftType,
			cursor,
			include: { content: true },
		});
		for (const object of page.objects) {
			const nft = client.suigar.bcs.NftV1.parse(object.content);
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

const referralClaimReadResult = async ({
	input,
	kind,
}: {
	input:
		| Partial<GetReferralCommissionInput>
		| Partial<GetReferralLevelUpUsdRewardsInput>;
	kind: ReferralClaimKind;
}) => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(
		requireString(input.owner, 'owner'),
		bundle,
	);
	const coin =
		kind === 'commission' && 'coinType' in input
			? coinMetadataForAmount(bundle.config, input.coinType)
			: bundle.config.sdk.coins.usdc;
	const amount =
		kind === 'commission'
			? await bundle.client.suigar.view.referral.getCommission({
					owner,
					coinType: coin.coinType,
				})
			: await bundle.client.suigar.view.referral.getLevelUpUsdRewards({
					owner,
				});

	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		owner,
		referral: {
			kind,
			coinType: coin.coinType,
			amount: amount.toString(),
			amountDisplay: formatBaseUnitAmount(amount, coin.decimals),
			notes: [
				'Amount is simulated with the SDK claim transaction and is not a signed or executed claim.',
			],
		},
	} satisfies ReferralClaimReadResult);
};

export const getReferralCommissionTool = async (
	input: Partial<GetReferralCommissionInput> = {},
) => referralClaimReadResult({ input, kind: 'commission' });

export const getReferralLevelUpUsdRewardsTool = async (
	input: Partial<GetReferralLevelUpUsdRewardsInput> = {},
) => referralClaimReadResult({ input, kind: 'level-up-usd-rewards' });

const referralReadOnlyPlan = ({
	input,
	kind,
}: {
	input:
		| BuildReferralCommissionClaimTransactionInput
		| BuildReferralLevelUpUsdRewardsClaimTransactionInput;
	kind: ReferralClaimKind;
}) => {
	const { config } = createSuigarClient(getConfigInput(input));
	const coin =
		kind === 'commission' && 'coinType' in input
			? coinMetadataForAmount(config, input.coinType)
			: config.sdk.coins.usdc;
	const plan = {
		target: referralClaimTarget(config, kind),
		typeArguments: [coin.coinType],
		requiredInputs: ['owner'],
		notes: [
			'Builds an unsigned referral claim transaction; the returned coin is transferred to the owner by the SDK.',
		],
	};
	return asTextResponse({
		mode: 'read-only',
		network: config.network,
		config,
		plan,
		referral: {
			kind,
			coinType: coin.coinType,
			packageId: config.sdk.packageIds.referral,
		},
	} satisfies ReferralClaimReadOnlyPlan);
};

const buildReferralClaimTransactionTool = async ({
	input,
	kind,
}: {
	input:
		| BuildReferralCommissionClaimTransactionInput
		| BuildReferralLevelUpUsdRewardsClaimTransactionInput;
	kind: ReferralClaimKind;
}) => {
	const mode = getMode(input.mode);
	if (mode === 'read-only') {
		return referralReadOnlyPlan({ input, kind });
	}

	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(
		requireString(input.owner, 'owner'),
		bundle,
	);
	const coin =
		kind === 'commission' && 'coinType' in input
			? coinMetadataForAmount(bundle.config, input.coinType)
			: bundle.config.sdk.coins.usdc;
	const transaction =
		kind === 'commission'
			? bundle.client.suigar.tx.referral.claimCommission({
					owner,
					coinType: coin.coinType,
					gasBudget: input.gasBudget,
				})
			: bundle.client.suigar.tx.referral.claimLevelUpUsdRewards({
					owner,
					gasBudget: input.gasBudget,
				});
	if (mode === 'execute') {
		const built = await buildTransactionResult({
			mode: 'build',
			transaction,
			config: bundle.config,
			client: bundle.client,
			context: { coinType: coin.coinType, gameInputs: { referralClaim: kind } },
		});
		const execution = await createExecutionBridge({
			network: bundle.config.network,
			frontendOrigin: frontendOriginFor(bundle.config.network),
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
				coinType: coin.coinType,
				gameInputs: { referralClaim: kind },
			},
		}),
	);
};

export const buildReferralCommissionClaimTransactionTool = async (
	input: BuildReferralCommissionClaimTransactionInput = {},
) => buildReferralClaimTransactionTool({ input, kind: 'commission' });

export const buildReferralLevelUpUsdRewardsClaimTransactionTool = async (
	input: BuildReferralLevelUpUsdRewardsClaimTransactionInput = {},
) => buildReferralClaimTransactionTool({ input, kind: 'level-up-usd-rewards' });

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
				...(await commonOptions(input, bundle)),
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
	return buildTransactionTool({
		input,
		game: 'pvp-coinflip',
		action: 'cancel',
		gameInputs: { gameId },
		createTransaction: async (bundle) =>
			bundle.client.suigar.tx.pvpCoinflip.cancelGame({
				...(await commonOptions(input, bundle)),
				gameId,
			}),
	});
};
