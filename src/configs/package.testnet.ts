// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarCoinTypes,
	SuigarPackage,
	SuigarPriceInfoObjectId,
} from '../types/suigar-config.type.js';

// `sweetHouse` is preserved manually because it is not currently resolved from MVR.
export const TESTNET_PACKAGE_IDS: SuigarPackage = {
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

export const TESTNET_COIN_TYPES: SuigarCoinTypes = {
	sui: '0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_sui::TEST_SUI',
	usdc: '0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_usdc::TEST_USDC',
};

export const TESTNET_PRICE_INFO_OBJECT_IDS: SuigarPriceInfoObjectId = {
	sui: '0x1ebb295c789cc42b3b2a1606482cd1c7124076a0f5676718501fda8c7fd075a0',
	usdc: '0x9c4dd4008297ffa5e480684b8100ec21cc934405ed9a25d4e4d7b6259aad9c81',
};
