// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { TESTNET_PACKAGE_IDS } from './src/configs/package.testnet.ts';

export interface PackageInfo {
	package: string;
	packageName: string;
	types?: boolean | string[];
	functions?: boolean | string[];
}

export const SUIGAR_PACKAGES: Record<string, PackageInfo> = {
	core: {
		package: TESTNET_PACKAGE_IDS.core,
		packageName: 'core',
		types: ['BetResultEvent'],
		functions: false,
	},
	// Games packages
	coinflip: {
		package: TESTNET_PACKAGE_IDS.coinflip,
		packageName: 'coinflip',
		types: ['Parameters'],
		functions: ['play'],
	},
	limbo: {
		package: TESTNET_PACKAGE_IDS.limbo,
		packageName: 'limbo',
		types: ['Parameters'],
		functions: ['play'],
	},
	plinko: {
		package: TESTNET_PACKAGE_IDS.plinko,
		packageName: 'plinko',
		types: ['PlinkoConfig', 'Parameters'],
		functions: ['play'],
	},
	pvp_coinflip: {
		package: TESTNET_PACKAGE_IDS.pvpCoinflip,
		packageName: 'pvp-coinflip',
		types: [
			'Game',
			'GameCreatedEvent',
			'GameResolvedEvent',
			'GameCancelledEvent',
			'Parameters',
		],
		functions: ['create_game', 'join_game', 'cancel_game'],
	},
	range: {
		package: TESTNET_PACKAGE_IDS.range,
		packageName: 'range',
		types: ['Parameters'],
		functions: ['play'],
	},
	wheel: {
		package: TESTNET_PACKAGE_IDS.wheel,
		packageName: 'wheel',
		types: ['WheelConfig', 'Parameters'],
		functions: ['play'],
	},
};
