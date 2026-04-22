// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiNetwork } from '../types/network.type.js';
import type { SuigarCoin } from '../types/suigar-config.type.js';
import {
	DEFAULT_MAINNET_PACKAGE_IDS,
	DEFAULT_MAINNET_PRICE_INFO_OBJECT_IDS,
} from './package.mainnet.js';
import {
	DEFAULT_TESTNET_PACKAGE_IDS,
	DEFAULT_TESTNET_PRICE_INFO_OBJECT_IDS,
} from './package.testnet.js';

export const SUIGAR_PACKAGES = {
	sweetHouse: 'sweetHouse',
	core: 'core',
	coinflip: 'coinflip',
	limbo: 'limbo',
	plinko: 'plinko',
	pvpCoinflip: 'pvpCoinflip',
	range: 'range',
	wheel: 'wheel',
} as const;

export type SuigarPackage = Record<keyof typeof SUIGAR_PACKAGES, string>;
export type SuigarPriceInfoObjectId = Record<SuigarCoin, string>;
export const PACKAGE_IDS: Record<SuiNetwork, SuigarPackage> = {
	mainnet: { ...DEFAULT_MAINNET_PACKAGE_IDS },
	testnet: { ...DEFAULT_TESTNET_PACKAGE_IDS },
};

export const PRICE_INFO_OBJECT_IDS: Record<
	SuiNetwork,
	SuigarPriceInfoObjectId
> = {
	mainnet: { ...DEFAULT_MAINNET_PRICE_INFO_OBJECT_IDS },
	testnet: { ...DEFAULT_TESTNET_PRICE_INFO_OBJECT_IDS },
};

export const DEFAULT_USDC_COIN_TYPE =
	'0xdba34672e30cb065b1f93e3a0e89fd79d1f22e12e55e88edbbcbac48609f4af0::usdc::USDC';
