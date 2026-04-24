// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag } from '@mysten/sui/utils';

import type { Game, SuigarCoin, SuigarConfig, SuiNetwork } from '../types';
import {
	COIN_TYPES,
	PACKAGE_IDS,
	PRICE_INFO_OBJECT_IDS,
	REGISTRY_IDS,
} from '../configs/index.js';

export function resolveSuigarConfig(network: SuiNetwork): SuigarConfig {
	const packageIds = PACKAGE_IDS[network];
	const registryIds = REGISTRY_IDS[network];
	const coinTypes = COIN_TYPES[network];
	const priceInfoObjectIds = PRICE_INFO_OBJECT_IDS[network];

	return {
		packageIds: { ...packageIds },
		registryIds: { ...registryIds },
		coinTypes: {
			sui: normalizeStructTag(coinTypes.sui),
			usdc: normalizeStructTag(coinTypes.usdc),
		},
		priceInfoObjectIds: {
			sui: priceInfoObjectIds.sui,
			usdc: priceInfoObjectIds.usdc,
		},
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

	if (objectId) {
		return objectId;
	}

	throw new Error(
		`Missing price info object configuration for coin type ${coinType}`,
	);
}

function resolveSupportedCoin(
	config: SuigarConfig,
	coinType: string,
): SuigarCoin {
	const entries = Object.entries(config.coinTypes) as Array<
		[SuigarCoin, string]
	>;
	const supportedCoin = entries.find(
		([, configuredCoinType]) => configuredCoinType === coinType,
	)?.[0];

	if (supportedCoin) {
		return supportedCoin;
	}

	throw new Error(
		`Unsupported coin type ${coinType}. Supported coin types: ${entries
			.map(([, configuredCoinType]) => configuredCoinType)
			.join(', ')}`,
	);
}
