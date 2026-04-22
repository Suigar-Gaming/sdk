// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarPackage, SuigarPriceInfoObjectId } from './package.js';

// `sweetHouse` is preserved manually because it is not currently resolved from MVR.
export const DEFAULT_MAINNET_PACKAGE_IDS: SuigarPackage = {
	sweetHouse:
		'0xa1549d73230118716bc08865b8d62454f360ddaf40eee2158e458e52125d4ef1',
	core: '0xcbb0929f21450013ebe5e86e7139f2409da2e3ed212c51126a7e6448b795a43f',
	coinflip:
		'0xca96885371150f55653f7fab9e9b146f5a19698b1002bdff42159ea9d2ba7d7e',
	limbo: '0x89db6a55ad4e650cad641b6f9fd90b391b22b1d9adbb2cabbfeb94a9eeda7026',
	plinko: '0x74a73daff11c11ed05299c93ed770c62ec4dc6756fa99e271e251c2399f49fef',
	pvpCoinflip:
		'0x29162faf01a8135630e0a32bbe4ce47f69607b24dbb1edea3800861f91d0030a',
	range: '0xd19e32b0f2a5e541fbd345b4602f8a93a2eee25c16029595b6fef0b1e0461a54',
	wheel: '0x6791eac73fe7bf463b7f3b1ea391df265fbc1b96201270664a5a11e2441e9955',
};

export const DEFAULT_MAINNET_PRICE_INFO_OBJECT_IDS: SuigarPriceInfoObjectId = {
	sui: '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
	usdc: '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
};
