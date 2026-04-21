// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import type { Game, SuigarConfig, SuigarOptions } from '../types';
import {
	DEFAULT_GAMES_PACKAGE_ID,
	DEFAULT_SWEETHOUSE_PACKAGE_ID,
	DEFAULT_USDC_COIN_TYPE,
	DEFAULT_USDC_FLOWX_COIN_TYPE,
} from '../configs/index.js';

const trim = (value?: string) => value?.trim() ?? '';

export function resolveSuigarConfig(options: SuigarOptions): SuigarConfig {
	const suiCoinType = normalizeStructTag(
		options.coinTypes?.sui ?? SUI_TYPE_ARG,
	);
	const usdcCoinType = normalizeStructTag(
		options.coinTypes?.usdc ?? DEFAULT_USDC_COIN_TYPE,
	);
	const usdcFlowxCoinType = normalizeStructTag(
		options.coinTypes?.usdcFlowx ?? DEFAULT_USDC_FLOWX_COIN_TYPE,
	);

	const explicitPriceInfoObjectIds = Object.fromEntries(
		Object.entries(options.pyth?.priceInfoObjectIds ?? {}).map(
			([coinType, objectId]) => [normalizeStructTag(coinType), objectId],
		),
	);

	return {
		sweetHousePackageId:
			trim(options.sweetHousePackageId) || trim(DEFAULT_SWEETHOUSE_PACKAGE_ID),
		coinTypes: {
			sui: suiCoinType,
			usdc: usdcCoinType,
			usdcFlowx: usdcFlowxCoinType,
		},
		gamesPackageId: {
			coinflip:
				trim(options.gamesPackageId?.coinflip) ||
				DEFAULT_GAMES_PACKAGE_ID.coinflip,
			limbo:
				trim(options.gamesPackageId?.limbo) || DEFAULT_GAMES_PACKAGE_ID.limbo,
			plinko:
				trim(options.gamesPackageId?.plinko) || DEFAULT_GAMES_PACKAGE_ID.plinko,
			'pvp-coinflip':
				trim(options.gamesPackageId?.['pvp-coinflip']) ||
				DEFAULT_GAMES_PACKAGE_ID.pvp_coinflip,
			range:
				trim(options.gamesPackageId?.range) || DEFAULT_GAMES_PACKAGE_ID.range,
			wheel:
				trim(options.gamesPackageId?.wheel) || DEFAULT_GAMES_PACKAGE_ID.wheel,
		},
		pyth: {
			packageId: trim(options.pyth?.packageId) || undefined,
			suiPriceInfoObjectId: trim(options.pyth?.suiPriceInfoObjectId),
			usdcPriceInfoObjectId: trim(options.pyth?.usdcPriceInfoObjectId),
			priceInfoObjectIds: explicitPriceInfoObjectIds,
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
