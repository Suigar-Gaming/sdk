// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import type { Game, SuigarConfig, SuiNetwork } from '../types';
import { DEFAULT_USDC_COIN_TYPE, PACKAGE_IDS } from '../configs/index.js';

export function resolveSuigarConfig(network: SuiNetwork): SuigarConfig {
	const packageIds = PACKAGE_IDS[network];
	const suiCoinType = normalizeStructTag(SUI_TYPE_ARG);
	const usdcCoinType = normalizeStructTag(DEFAULT_USDC_COIN_TYPE);
	const usdcFlowxCoinType = normalizeStructTag(DEFAULT_USDC_COIN_TYPE);

	return {
		sweetHousePackageId: packageIds.sweetHouse,
		coinTypes: {
			sui: suiCoinType,
			usdc: usdcCoinType,
			usdcFlowx: usdcFlowxCoinType,
		},
		gamesPackageId: {
			coinflip: packageIds.coinflip,
			limbo: packageIds.limbo,
			plinko: packageIds.plinko,
			'pvp-coinflip': packageIds.pvpCoinflip,
			range: packageIds.range,
			wheel: packageIds.wheel,
		},
		pyth: {
			priceInfoObjectIds: {},
		},
	};
}

export function resolveGamePackageId(config: SuigarConfig, game: Game): string {
	return config.gamesPackageId[game];
}

export function resolvePythPriceInfoObjectId(
	config: SuigarConfig,
	coinType: string,
): string {
	const normalizedCoinType = normalizeStructTag(coinType);
	const explicitObjectId = config.pyth.priceInfoObjectIds[normalizedCoinType];

	if (explicitObjectId) {
		return explicitObjectId;
	}

	if (
		normalizedCoinType === config.coinTypes.sui &&
		config.pyth.suiPriceInfoObjectId
	) {
		return config.pyth.suiPriceInfoObjectId;
	}

	if (
		(normalizedCoinType === config.coinTypes.usdc ||
			normalizedCoinType === config.coinTypes.usdcFlowx) &&
		config.pyth.usdcPriceInfoObjectId
	) {
		return config.pyth.usdcPriceInfoObjectId;
	}

	throw new Error(
		`Missing Pyth price object configuration for coin type ${coinType}`,
	);
}

export function assertConfiguredBetGame(
	config: SuigarConfig,
	game: Game,
): void {
	if (!config.gamesPackageId[game]) {
		throw new Error(
			`Missing required config for ${game}: gamesPackageId.${game}`,
		);
	}
}
