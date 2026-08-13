// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag } from '@mysten/sui/utils';
import { COINS, OBJECT_IDS, PACKAGE_IDS, REGISTRY_IDS } from '../configs/index.js';
import type {
	SuigarCoin,
	SuigarCoinMetadata,
	SuigarConfig,
	SuigarConfigOverrides,
	SuigarNetwork,
	WithCoinType,
	WithConfig,
	WithGame,
} from '../types/index.js';

export const DEFAULT_CACHE_TTL_MS: number = 30 * 60 * 1000;

type GamePackageIdOptions = WithGame<WithConfig>;

export function resolveSuigarConfig({
	network,
	config = {},
}: {
	network: SuigarNetwork;
	config?: SuigarConfigOverrides;
}): SuigarConfig {
	const packageIds = PACKAGE_IDS[network];
	const objectIds = OBJECT_IDS[network];
	const registryIds = REGISTRY_IDS[network];
	const coins = COINS[network];

	const resolvedCoins = getSupportedCoins(coins).reduce(
		(result, coin) => {
			result[coin] = resolveCoinMetadata({
				coin,
				coinMetadata: coins[coin],
				configCoinMetadata: config.coins?.[coin],
			});
			return result;
		},
		{} as SuigarConfig['coins'],
	);

	return {
		packageIds: { ...packageIds, ...config.packageIds },
		objectIds: { ...objectIds, ...config.objectIds },
		registryIds: { ...registryIds, ...config.registryIds },
		coins: resolvedCoins,
	};
}

export function assertConfiguredBetGame({ config, game }: GamePackageIdOptions): void {
	if (!resolveGamePackageId({ config, game })) {
		throw new Error(`Missing required config for ${game}: packageIds.${game}`);
	}
}

export function resolveGamePackageId({ config, game }: GamePackageIdOptions): string {
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

export function resolvePriceInfoObjectId({ config, coinType }: WithConfig<WithCoinType>): string {
	const normalizedCoinType = normalizeStructTag(coinType);
	const supportedCoin = resolveSupportedCoin({
		config,
		coinType: normalizedCoinType,
	});
	const objectId = config.coins[supportedCoin].priceInfoObjectId;

	if (!objectId) {
		throw new Error(`Missing price info object configuration for coin type ${coinType}`);
	}

	return objectId;
}

function getSupportedCoins(coins: SuigarConfig['coins']): Array<SuigarCoin> {
	return Object.keys(coins) as Array<SuigarCoin>;
}

function resolveCoinMetadata({
	coin,
	coinMetadata,
	configCoinMetadata,
}: {
	coin: SuigarCoin;
	coinMetadata: SuigarCoinMetadata;
	configCoinMetadata?: Partial<SuigarCoinMetadata>;
}): SuigarCoinMetadata {
	const metadata = { ...coinMetadata, ...configCoinMetadata };
	if (
		!metadata.coinType ||
		!Number.isSafeInteger(metadata.decimals) ||
		!metadata.priceInfoObjectId
	) {
		throw new Error(`Missing coin metadata configuration for supported coin ${coin}`);
	}

	return {
		...metadata,
		coinType: normalizeStructTag(metadata.coinType),
	};
}

function resolveSupportedCoin({ config, coinType }: WithConfig<WithCoinType>): SuigarCoin {
	const supportedCoin = getSupportedCoins(config.coins).find(
		(coin) => config.coins[coin].coinType === coinType,
	);

	if (!supportedCoin) {
		throw new RangeError(
			`Unsupported coin type ${coinType}. Supported coin types: ${Object.values(config.coins)
				.map(({ coinType }) => coinType)
				.join(', ')}`,
		);
	}

	return supportedCoin;
}
