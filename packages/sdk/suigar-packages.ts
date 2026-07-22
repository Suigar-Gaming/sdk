// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { PACKAGE_IDS as TESTNET_PACKAGE_IDS } from './src/configs/testnet/packages.ts';

export interface PackageInfo {
	package: string;
	packageName: string;
	types?: boolean | string[];
	functions?: boolean | string[];
}

export const SUIGAR_PACKAGES: Record<string, PackageInfo> = {
	nft: {
		package: TESTNET_PACKAGE_IDS.nftV1,
		packageName: 'nft-v1',
		types: ['Factory', 'Nft'],
		functions: false,
	},
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
		types: ['CoinFlipSettingsKey', 'Parameters'],
		functions: ['play'],
	},
	limbo: {
		package: TESTNET_PACKAGE_IDS.limbo,
		packageName: 'limbo',
		types: ['LimboSettingsKey', 'Parameters'],
		functions: ['play'],
	},
	plinko: {
		package: TESTNET_PACKAGE_IDS.plinko,
		packageName: 'plinko',
		types: ['PlinkoSettingsKey', 'PlinkoConfig', 'Parameters'],
		functions: ['play'],
	},
	pvp_coinflip: {
		package: TESTNET_PACKAGE_IDS.pvpCoinflip,
		packageName: 'pvp-coinflip',
		types: [
			'PvpCoinflipSettingsKey',
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
		types: ['RangeSettingsKey', 'Parameters'],
		functions: ['play'],
	},
	soccer: {
		package: TESTNET_PACKAGE_IDS.soccer,
		packageName: 'soccer',
		types: ['SoccerSettingsKey', 'SoccerConfig', 'Parameters'],
		functions: ['play'],
	},
	wheel: {
		package: TESTNET_PACKAGE_IDS.wheel,
		packageName: 'wheel',
		types: ['WheelSettingsKey', 'WheelConfig', 'Parameters'],
		functions: ['play'],
	},
};
