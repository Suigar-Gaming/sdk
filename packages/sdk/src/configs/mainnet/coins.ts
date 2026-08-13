// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { SUI_DECIMALS, SUI_TYPE_ARG } from '@mysten/sui/utils';
import type { SuigarCoinRegistry } from '../../types/index.js';

export const COINS: SuigarCoinRegistry = {
	sui: {
		coinType: SUI_TYPE_ARG,
		decimals: SUI_DECIMALS,
		priceInfoObjectId: '0x801dbc2f0053d34734814b2d6df491ce7807a725fe9a01ad74a07e9c51396c37',
	},
	usdc: {
		coinType: '0xdba34672e30cb065b1f93e3ab55318768fd6fef66c15942c9f7cb846e2f900e7::usdc::USDC',
		decimals: 6,
		priceInfoObjectId: '0x5dec622733a204ca27f5a90d8c2fad453cc6665186fd5dff13a83d0b6c9027ab',
	},
};
