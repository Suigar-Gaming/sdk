// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag } from '@mysten/sui/utils';
import {
	COINS,
	OBJECT_IDS,
	PACKAGE_IDS,
	REGISTRY_IDS,
} from '../configs/index.js';
import type {
	SuigarCoin,
	SuigarCoinMetadata,
	SuigarConfig,
	SuigarConfigOverrides,
	SuigarNetwork,
	WithConfig,
	WithGame,
} from '../types/index.js';

export const DEFAULT_CACHE_TTL_MS: number = 30 * 60 * 1000;

type GamePackageIdOptions = WithGame<WithConfig<{}>>;

export function resolveSuigarConfig({
	network,
	overrides = {},
}: {
	network: SuigarNetwork;
	overrides?: SuigarConfigOverrides;
}): SuigarConfig {
	const packageIds = PACKAGE_IDS[network];
	const objectIds = OBJECT_IDS[network];
	const registryIds = REGISTRY_IDS[network];
	const coins = COINS[network];

	const resolvedCoins = getSupportedCoins(coins).reduce(
		(result, supportedCoin) => {
			result[supportedCoin] = resolveCoinMetadata(
				supportedCoin,
				coins[supportedCoin],
				overrides.coins?.[supportedCoin],
			);
			return result;
		},
		{} as SuigarConfig['coins'],
	);

	return {
		packageIds: { ...packageIds, ...overrides.packageIds },
		objectIds: { ...objectIds, ...overrides.objectIds },
		registryIds: { ...registryIds, ...overrides.registryIds },
		coins: resolvedCoins,
	};
}

export function assertConfiguredBetGame({
	config,
	game,
}: GamePackageIdOptions): void {
	if (!resolveGamePackageId({ config, game })) {
		throw new Error(`Missing required config for ${game}: packageIds.${game}`);
	}
}

export function resolveGamePackageId({
	config,
	game,
}: GamePackageIdOptions): string {
	switch (game) {
		case 'coinflip':
			return config.packageIds.coinflip;
		case 'limbo':
			return config.packageIds.limbo;
		case 'plinko':
			return config.packageIds.plinko;
		case 'pvp-coinflip':
			return config.packageIds.pvpCoinflip;
		case 'range':
			return config.packageIds.range;
		case 'soccer':
			return config.packageIds.soccer;
		case 'wheel':
			return config.packageIds.wheel;
	}
}

export function resolvePriceInfoObjectId({
	config,
	coinType,
}: WithConfig<{ coinType: string }>): string {
	const normalizedCoinType = normalizeStructTag(coinType);
	const supportedCoin = resolveSupportedCoin(config, normalizedCoinType);
	const objectId = config.coins[supportedCoin].priceInfoObjectId;

	if (!objectId) {
		throw new Error(
			`Missing price info object configuration for coin type ${coinType}`,
		);
	}

	return objectId;
}

function getSupportedCoins(coins: SuigarConfig['coins']): Array<SuigarCoin> {
	return Object.keys(coins) as Array<SuigarCoin>;
}

function resolveCoinMetadata(
	supportedCoin: SuigarCoin,
	defaultCoin: SuigarCoinMetadata,
	override?: Partial<SuigarCoinMetadata>,
): SuigarCoinMetadata {
	const coin = { ...defaultCoin, ...override };
	if (
		!coin.coinType ||
		!Number.isSafeInteger(coin.decimals) ||
		!coin.priceInfoObjectId
	) {
		throw new Error(
			`Missing coin metadata configuration for supported coin ${supportedCoin}`,
		);
	}

	return {
		...coin,
		coinType: normalizeStructTag(coin.coinType),
	};
}

function resolveSupportedCoin(
	config: SuigarConfig,
	coinType: string,
): SuigarCoin {
	const supportedCoin = getSupportedCoins(config.coins).find(
		(coin) => config.coins[coin].coinType === coinType,
	);

	if (!supportedCoin) {
		throw new RangeError(
			`Unsupported coin type ${coinType}. Supported coin types: ${Object.values(
				config.coins,
			)
				.map(({ coinType }) => coinType)
				.join(', ')}`,
		);
	}

	return supportedCoin;
}
