// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { parseStructTag } from '@mysten/sui/utils';
import { GAMES, type Game } from '@suigar/sdk/games';
import {
	resolveDefaultCoinType,
	resolveOwnerAddress,
	type BuilderMode,
	type ReferralClaimKind,
	type ResolvedMcpConfig,
	type SuigarClientBundle,
	type ToolTextResult,
} from '../../runtime/index.js';
import { formatBaseUnitAmount } from '../../utils/index.js';
import { loadCredentials } from '../../wallet/index.js';
import type { ReadConfigInput } from '../schemas/index.js';

export const GAME_LABELS = {
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

const json = (value: unknown) =>
	JSON.stringify(
		value,
		(_key, item) => (typeof item === 'bigint' ? item.toString() : item),
		2,
	);

export const asTextResponse = <T extends ToolTextResult['structuredContent']>(
	structuredContent: T,
): ToolTextResult => ({
	content: [{ type: 'text', text: json(structuredContent) }],
	structuredContent,
});

export const coinMetadataForAmount = (
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

export const requireString = (value: unknown, fieldName: string): string => {
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	throw new TypeError(`Missing required field: ${fieldName}.`);
};

export const requireGame = (value: unknown): Game => {
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

export const formatGameParameters = (
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

export const getMode = (mode: BuilderMode | undefined): BuilderMode =>
	mode ?? 'build';

export const getConfigInput = (input: ReadConfigInput) => ({
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

export const resolveCoinDisplayMetadata = async (
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

export const resolveWalletOwner = async (
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

export const supportedGames = () =>
	GAMES.map((id) => ({
		id,
		label: GAME_LABELS[id],
		tools: [...GAME_TO_TOOLS[id]],
	}));

export const supportedFeatures = () => [
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

export const getPackageId = (config: ResolvedMcpConfig, game: Game) =>
	config.sdk.packageIds[GAME_TO_PACKAGE_KEY[game]];

export const referralClaimTarget = (
	config: ResolvedMcpConfig,
	kind: ReferralClaimKind,
) =>
	`${config.sdk.packageIds.referral}::referral::${
		kind === 'commission'
			? 'claim_commission_balance'
			: 'claim_referrer_level_up_usd_rewards'
	}`;
