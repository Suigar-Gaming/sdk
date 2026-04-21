// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DeepPartial } from './deep-partial.type';
import { Game } from './game.type';

export interface SuigarOptions<
	Name = 'suigar',
> extends DeepPartial<SuigarConfig> {
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
	packageId?: string;
	priceInfoObjectIds: Record<string, string>;
	suiPriceInfoObjectId: string;
	usdcPriceInfoObjectId: string;
};
