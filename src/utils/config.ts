// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import type { Game, SuigarCoin, SuigarConfig, SuiNetwork } from '../types';
import {
	DEFAULT_USDC_COIN_TYPE,
	PACKAGE_IDS,
	PRICE_INFO_OBJECT_IDS,
} from '../configs/index.js';

export function resolveSuigarConfig(network: SuiNetwork): SuigarConfig {
	const packageIds = PACKAGE_IDS[network];
	const priceInfoObjectIds = PRICE_INFO_OBJECT_IDS[network];
	const suiCoinType = normalizeStructTag(SUI_TYPE_ARG);
	const usdcCoinType = normalizeStructTag(DEFAULT_USDC_COIN_TYPE);

	return {
		sweetHousePackageId: packageIds.sweetHouse,
		coinTypes: {
			sui: suiCoinType,
			usdc: usdcCoinType,
		},
		gamesPackageId: {
			coinflip: packageIds.coinflip,
			limbo: packageIds.limbo,
			plinko: packageIds.plinko,
			'pvp-coinflip': packageIds.pvpCoinflip,
			range: packageIds.range,
			wheel: packageIds.wheel,
		},
		priceInfoObjectIds: {
			sui: priceInfoObjectIds.sui,
			usdc: priceInfoObjectIds.usdc,
		},
	};
}

export function resolveGamePackageId(config: SuigarConfig, game: Game): string {
	return config.gamesPackageId[game];
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
