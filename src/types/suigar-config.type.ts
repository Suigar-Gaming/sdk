// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarPackage } from '../configs/package.js';

export interface SuigarExtensionOptions<Name = 'suigar'> {
	name?: Name;
}

export type SuigarCoin = 'sui' | 'usdc';

export type SuigarCoinTypes = Record<SuigarCoin, string>;

export type SuigarConfig = {
	packageIds: SuigarPackage;
	coinTypes: SuigarCoinTypes;
	priceInfoObjectIds: Record<SuigarCoin, string>;
};
