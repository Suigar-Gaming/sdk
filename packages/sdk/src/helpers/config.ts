// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag } from '@mysten/sui/utils';
import {
	COINS,
	PACKAGE_IDS,
	PRICE_INFO_OBJECT_IDS,
	REGISTRY_IDS,
} from '../configs/index.js';
import type {
	Game,
	SuigarCoin,
	SuigarConfig,
	SuigarConfigOverrides,
	SuiNetwork,
} from '../types/index.js';

export const DEFAULT_CACHE_TTL_MS = 30 * 60 * 1000;

export function resolveSuigarConfig(
	network: SuiNetwork,
	overrides: SuigarConfigOverrides = {},
): SuigarConfig {
	const packageIds = PACKAGE_IDS[network];
	const registryIds = REGISTRY_IDS[network];
	const coins = COINS[network];
	const priceInfoObjectIds = PRICE_INFO_OBJECT_IDS[network];

	const resolvedCoins = Object.fromEntries(
		Object.entries(coins).map(([key, value]) => {
			const supportedCoin = key as keyof SuigarConfig['coins'];
			const coin = { ...value, ...overrides.coins?.[supportedCoin] };
			if (!coin.coinType || coin.decimals === undefined) {
				throw new Error(
					`Missing coin metadata configuration for supported coin ${key}`,
				);
			}
			return [
				key,
				{
					...coin,
					coinType: normalizeStructTag(coin.coinType),
				},
			];
		}),
	);

	return {
		packageIds: { ...packageIds, ...overrides.packageIds },
		registryIds: { ...registryIds, ...overrides.registryIds },
		coins: resolvedCoins as SuigarConfig['coins'],
		priceInfoObjectIds: {
			...priceInfoObjectIds,
			...overrides.priceInfoObjectIds,
		} as SuigarConfig['priceInfoObjectIds'],
	};
}

export function assertConfiguredBetGame(
	config: SuigarConfig,
	game: Game,
): void {
	if (!resolveGamePackageId(config, game)) {
		throw new Error(`Missing required config for ${game}: packageIds.${game}`);
	}
}

export function resolveGamePackageId(config: SuigarConfig, game: Game): string {
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
		case 'wheel':
			return config.packageIds.wheel;
	}
}

export function resolvePriceInfoObjectId(
	config: SuigarConfig,
	coinType: string,
): string {
	const normalizedCoinType = normalizeStructTag(coinType);
	const supportedCoin = resolveSupportedCoin(config, normalizedCoinType);
	const objectId = config.priceInfoObjectIds[supportedCoin];

	if (!objectId) {
		throw new Error(
			`Missing price info object configuration for coin type ${coinType}`,
		);
	}

	return objectId;
}

function resolveSupportedCoin(
	config: SuigarConfig,
	coinType: string,
): SuigarCoin {
	const [supportedCoin] =
		Object.entries(config.coins).find(
			([_, value]) => value.coinType === coinType,
		) ?? [];

	if (!supportedCoin) {
		throw new RangeError(
			`Unsupported coin type ${coinType}. Supported coin types: ${Object.values(
				config.coins,
			)
				.map(({ coinType }) => coinType)
				.join(', ')}`,
		);
	}

	return supportedCoin as SuigarCoin;
}
