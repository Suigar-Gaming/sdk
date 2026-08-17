// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarCoinRegistry } from '../../types/index.js';

export const COINS: SuigarCoinRegistry = {
	sui: {
		coinType:
			'0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_sui::TEST_SUI',
		decimals: 9,
		priceInfoObjectId: '0x867877562b5d8ac262d93b02062e04b428a2f9bfbb2f05b8af52e04cd98bd241',
	},
	usdc: {
		coinType:
			'0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_usdc::TEST_USDC',
		decimals: 6,
		priceInfoObjectId: '0x17de8d80e8efedfd1053c46fb921e51824479ed32c6aded5f7279995bb84db05',
	},
};
