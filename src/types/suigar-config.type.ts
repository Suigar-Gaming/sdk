// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export interface SuigarExtensionOptions<Name = 'suigar'> {
	name?: Name;
	partner?: string;
}

export type SuigarCoin = 'sui' | 'usdc';

export type SuigarCoinTypes = Record<SuigarCoin, string>;
export type SuigarPackageKey =
	| 'sweetHouse'
	| 'core'
	| 'coinflip'
	| 'limbo'
	| 'plinko'
	| 'pvpCoinflip'
	| 'range'
	| 'wheel';
export type SuigarPackage = Record<SuigarPackageKey, string>;
export type SuigarPriceInfoObjectId = Record<SuigarCoin, string>;

export type SuigarConfig = {
	packageIds: SuigarPackage;
	coinTypes: SuigarCoinTypes;
	priceInfoObjectIds: SuigarPriceInfoObjectId;
};
