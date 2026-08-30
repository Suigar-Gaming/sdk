// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { parseStructTag } from '@mysten/sui/utils';
import { GAMES, type Game } from '@suigar/sdk/games';
import {
	resolveDefaultCoinType,
	resolveOwnerAddress,
	type BuilderMode,
	type McpConfig,
	type ReadConfigResult,
	type SuigarClientBundle,
	type ToolTextResult,
} from '../../runtime/index.js';
import { formatBaseUnitAmount, isAmountFieldName } from '../../utils/index.js';
import { loadCredentials, loadSessionWallet } from '../../wallet/index.js';
import type { ConfigInput, ReadConfigInput } from '../schemas/index.js';

export const GAME_LABELS = {
	coinflip: 'Coinflip',
	keno: 'Keno',
	limbo: 'Limbo',
	plinko: 'Plinko',
	range: 'Range',
	soccer: 'Soccer',
	wheel: 'Wheel',
	'pvp-coinflip': 'PvP Coinflip',
} as const satisfies Record<Game, string>;

type PackageKey = keyof McpConfig['sdk']['packageIds'];
type ResolvablePackage = Game | 'referral' | 'nftV1' | 'core';

const SUIGAR_PACKAGE_KEYS: Record<ResolvablePackage, PackageKey> = {
	coinflip: 'coinflip',
	core: 'core',
	keno: 'keno',
	limbo: 'limbo',
	nftV1: 'nftV1',
	plinko: 'plinko',
	range: 'range',
	referral: 'referral',
	soccer: 'soccer',
	wheel: 'wheel',
	'pvp-coinflip': 'pvpCoinflip',
};

const SUIGAR_PACKAGE_FALLBACKS: Partial<Record<ResolvablePackage, string>> = {
	coinflip: '@suigar/coinflip',
	core: '@suigar/core',
	keno: '@suigar/keno',
	limbo: '@suigar/limbo',
	plinko: '@suigar/plinko',
	range: '@suigar/range',
	referral: '@suigar/referral',
	soccer: '@suigar/soccer',
	wheel: '@suigar/wheel',
	'pvp-coinflip': '@suigar/pvp-coinflip',
};

const GAME_TO_TOOLS = {
	coinflip: ['build_coinflip_transaction'],
	keno: ['build_keno_transaction'],
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

function json(value: unknown): string {
	return JSON.stringify(
		value,
		(_key, item) => (typeof item === 'bigint' ? item.toString() : item),
		2,
	);
}

export function asTextResponse<T extends ToolTextResult['structuredContent']>(
	structuredContent: T,
): ToolTextResult {
	return {
		content: [{ type: 'text', text: json(structuredContent) }],
		structuredContent,
	};
}

export function coinMetadataForAmount(
	config: McpConfig,
	coinType?: string,
): { coinType: string; decimals: number } {
	const resolvedCoinType = resolveDefaultCoinType(config, coinType);
	const coin = Object.values(config.sdk.coins).find(
		(metadata) => resolveDefaultCoinType(config, metadata.coinType) === resolvedCoinType,
	);

	if (!coin) {
		throw new RangeError(
			`Unable to resolve decimals for coin type ${resolvedCoinType}. Use a coin type configured in the Suigar extension config under "coins.sui" or "coins.usdc" before using currency-denominated amounts.`,
		);
	}

	return {
		coinType: resolvedCoinType,
		decimals: coin.decimals,
	};
}

export function requireString(value: unknown, fieldName: string): string {
	if (typeof value === 'string' && value.trim()) {
		return value.trim();
	}
	throw new TypeError(`Missing required field: ${fieldName}.`);
}

export function requireGame(value: unknown): Game {
	const game = requireString(value, 'game');
	if (GAMES.includes(game as Game)) {
		return game as Game;
	}
	throw new RangeError(`Unsupported game: ${game}. Use one of: ${GAMES.join(', ')}.`);
}

function formatGameParameterValue(key: string, value: unknown, decimals: number): unknown {
	if (Array.isArray(value)) {
		return value.map((item) => formatGameParameterValue(key, item, decimals));
	}
	if (value && typeof value === 'object') {
		return formatGameParameters(value as Record<string, unknown>, decimals);
	}
	return isAmountFieldName(key) &&
		(typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint')
		? {
				raw: String(value),
				display: formatBaseUnitAmount(value, decimals),
			}
		: value;
}

export function formatGameParameters(
	parameters: Record<string, unknown>,
	decimals: number,
): Record<string, unknown> {
	const formatted: Record<string, ReturnType<typeof formatGameParameterValue>> = {};
	for (const key of Object.keys(parameters)) {
		formatted[key] = formatGameParameterValue(key, parameters[key], decimals);
	}
	return formatted;
}

export function getMode(mode: BuilderMode | undefined): BuilderMode {
	return mode ?? 'build';
}

export function getConfigInput(input: ReadConfigInput): ConfigInput {
	return {
		network: input.network,
		providerUrl: input.providerUrl,
		config: input.config,
		partner: input.partner,
	};
}

function coinSymbol(coinType: string): string {
	try {
		return parseStructTag(coinType).name;
	} catch {
		return coinType;
	}
}

export async function resolveCoinDisplayMetadata(
	coinType: string,
	bundle: SuigarClientBundle,
): Promise<{ decimals: number | undefined; symbol: string }> {
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
}

export async function resolveWalletOwner(
	input: {
		owner?: string;
		network?: 'mainnet' | 'testnet';
		sessionWalletId?: string;
	},
	bundle: SuigarClientBundle,
): Promise<string> {
	if (input.owner) return await resolveOwnerAddress(input.owner, bundle);
	if (input.sessionWalletId) {
		const sessionWallet = await loadSessionWallet(input.sessionWalletId);
		if (!sessionWallet) {
			throw new Error('No local session wallet exists with that ID.');
		}
		return sessionWallet.address;
	}
	const credentials = await loadCredentials();
	const profile = credentials.profiles[bundle.config.network];
	if (!profile)
		throw new Error(
			`No wallet is connected for ${bundle.config.network}. Call "suigar_login" first.`,
		);
	return profile.address;
}

export function supportedGames(): ReadConfigResult['supportedGames'] {
	return GAMES.map((id) => ({
		id,
		label: GAME_LABELS[id],
		tools: [...GAME_TO_TOOLS[id]],
	}));
}

export function supportedFeatures(): ReadConfigResult['supportedFeatures'] {
	return [
		{
			id: 'nfts' as const,
			label: 'NFTs',
			tools: ['list_nfts', 'build_nft_v1_mint_transaction'],
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
		{
			id: 'sweethouse' as const,
			label: 'SweetHouse',
			tools: [
				'build_sweethouse_deposit_transaction',
				'build_sweethouse_redeem_request_transaction',
				'build_sweethouse_claim_own_redeem_request_after_delay_transaction',
			],
		},
	];
}

export function getSuigarPackageId(config: McpConfig, pkg: ResolvablePackage): string {
	const packageId =
		config.sdk.packageIds[SUIGAR_PACKAGE_KEYS[pkg]] ?? SUIGAR_PACKAGE_FALLBACKS[pkg];
	if (!packageId) {
		throw new RangeError(`Missing Suigar package id for ${pkg}.`);
	}
	return packageId;
}
