// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Game } from './game.type';

export interface SuigarExtensionOptions<Name = 'suigar'> {
	name?: Name;
}

export type SuigarCoin = 'sui' | 'usdc';

export type SuigarCoinTypes = Record<SuigarCoin, string>;

export type SuigarConfig = {
	sweetHousePackageId: string;
	coinTypes: SuigarCoinTypes;
	gamesPackageId: Record<Game, string>;
	priceInfoObjectIds: Record<SuigarCoin, string>;
};
