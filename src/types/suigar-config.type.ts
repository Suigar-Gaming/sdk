// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Game } from './game.type';

export interface SuigarExtensionOptions<Name = 'suigar'> {
	name?: Name;
}

export type SuigarConfig = {
	sweetHousePackageId: string;
	coinTypes: {
		sui: string;
		usdc: string;
		usdcFlowx: string;
	};
	gamesPackageId: Record<Game, string>;
	pyth: SuigarPythConfig;
};

export type SuigarPythConfig = {
	priceInfoObjectIds: Record<string, string>;
	suiPriceInfoObjectId?: string;
	usdcPriceInfoObjectId?: string;
};
