// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiNetwork } from '../types/network.type.js';
import type { SuigarCoin } from '../types/suigar-config.type.js';

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

const CURRENT_PACKAGE_IDS: SuigarPackage = {
	sweetHouse:
		'0xb7f64e5a273aba1ede00caa0a6f8027cc7490c279d17eab12e7100ed20660603',
	core: '0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc',
	coinflip:
		'0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea',
	limbo: '0x96c7841b9b32c59a219760fd656f1c3aceb53cc74a68ec9844a3a696374309f4',
	plinko: '0xd3dd2200883af10811724f0bed97591ad155a02efd6332d471ff8b346030dfb7',
	pvpCoinflip:
		'0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202',
	range: '0x096a4cf18b3661e76b2c62b90785418345d52f45b272448794f123a4cb6b6416',
	wheel: '0x0997852ded7e13301c42317004bc49704a893aa82997c5706cebee59053a31b7',
};

// The repository currently tracks one published package set. Reuse it for both
// supported networks until network-specific deployment ids are available here.
export const PACKAGE_IDS: Record<SuiNetwork, SuigarPackage> = {
	mainnet: { ...CURRENT_PACKAGE_IDS },
	testnet: { ...CURRENT_PACKAGE_IDS },
};

const CURRENT_PRICE_INFO_OBJECT_IDS: SuigarPriceInfoObjectId = {
	sui: '',
	usdc: '',
};

export const PRICE_INFO_OBJECT_IDS: Record<
	SuiNetwork,
	SuigarPriceInfoObjectId
> = {
	mainnet: { ...CURRENT_PRICE_INFO_OBJECT_IDS },
	testnet: { ...CURRENT_PRICE_INFO_OBJECT_IDS },
};

export const DEFAULT_USDC_COIN_TYPE =
	'0xdba34672e30cb065b1f93e3a0e89fd79d1f22e12e55e88edbbcbac48609f4af0::usdc::USDC';
