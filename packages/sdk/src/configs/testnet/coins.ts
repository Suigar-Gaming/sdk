// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarCoinRegistry } from '../../types/index.js';

export const COINS: SuigarCoinRegistry = {
	sui: {
		coinType:
			'0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_sui::TEST_SUI',
		decimals: 9,
		priceInfoObjectId: '0x1ebb295c789cc42b3b2a1606482cd1c7124076a0f5676718501fda8c7fd075a0',
	},
	usdc: {
		coinType:
			'0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_usdc::TEST_USDC',
		decimals: 6,
		priceInfoObjectId: '0x9c4dd4008297ffa5e480684b8100ec21cc934405ed9a25d4e4d7b6259aad9c81',
	},
};
