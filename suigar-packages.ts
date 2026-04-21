// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	DEFAULT_CORE_PACKAGE_ID,
	DEFAULT_GAMES_PACKAGE_ID,
} from './src/configs/package-id.ts';

export interface PackageInfo {
	package: string;
	packageName: string;
	types?: boolean | string[];
	functions?: boolean | string[];
}

export const SUIGAR_PACKAGES: Record<string, PackageInfo> = {
	core: {
		package: DEFAULT_CORE_PACKAGE_ID,
		packageName: 'core',
		types: ['BetResultEvent'],
		functions: false,
	},
	// Games packages
	coinflip: {
		package: DEFAULT_GAMES_PACKAGE_ID.coinflip,
		packageName: 'coinflip',
		types: [],
		functions: ['play'],
	},
	limbo: {
		package: DEFAULT_GAMES_PACKAGE_ID.limbo,
		packageName: 'limbo',
		types: [],
		functions: ['play'],
	},
	plinko: {
		package: DEFAULT_GAMES_PACKAGE_ID.plinko,
		packageName: 'plinko',
		types: [],
		functions: ['play'],
	},
	pvp_coinflip: {
		package: DEFAULT_GAMES_PACKAGE_ID.pvp_coinflip,
		packageName: 'pvp-coinflip',
		types: ['GameCreatedEvent', 'GameResolvedEvent', 'GameCancelledEvent'],
		functions: ['create_game', 'join_game', 'cancel_game'],
	},
	range: {
		package: DEFAULT_GAMES_PACKAGE_ID.range,
		packageName: 'range',
		types: [],
		functions: ['play'],
	},
	wheel: {
		package: DEFAULT_GAMES_PACKAGE_ID.wheel,
		packageName: 'wheel',
		types: [],
		functions: ['play'],
	},
};
