// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { PACKAGE_IDS as TESTNET_PACKAGE_IDS } from './src/configs/testnet/packages.ts';

interface PackageInfo {
	package: string;
	packageName: string;
	types?: boolean | Array<string>;
	functions?: boolean | Array<string>;
}

export const SUIGAR_PACKAGES: Record<string, PackageInfo> = {
	nft: {
		package: TESTNET_PACKAGE_IDS.nftV1,
		packageName: 'nft-v1',
		types: ['Factory', 'Nft'],
		functions: ['mint_to_sender'],
	},
	core: {
		package: '@suigar/core',
		packageName: 'core',
		types: ['BetResultEvent'],
		functions: false,
	},
	referral: {
		package: '@suigar/referral',
		packageName: 'referral',
		types: ['ReferrerClaimCommissionBalanceEvent', 'ReferrerClaimLevelUpUsdRewardsEvent'],
		functions: ['claim_commission_balance', 'claim_referrer_level_up_usd_rewards_v2'],
	},
	// Games packages
	coinflip: {
		package: '@suigar/coinflip',
		packageName: 'coinflip',
		types: ['CoinFlipSettingsKey', 'Parameters'],
		functions: ['play_v2'],
	},
	limbo: {
		package: '@suigar/limbo',
		packageName: 'limbo',
		types: ['LimboSettingsKey', 'Parameters'],
		functions: ['play_v2'],
	},
	plinko: {
		package: '@suigar/plinko',
		packageName: 'plinko',
		types: ['PlinkoSettingsKey', 'PlinkoConfig', 'Parameters'],
		functions: ['play_v2'],
	},
	pvp_coinflip: {
		package: '@suigar/pvp-coinflip',
		packageName: 'pvp-coinflip',
		types: [
			'PvpCoinflipSettingsKey',
			'PvpCoinflipRegistryKey',
			'Game',
			'GameCreatedEvent',
			'GameResolvedEvent',
			'GameCancelledEvent',
			'Parameters',
		],
		functions: ['create_game', 'join_game_v2', 'cancel_game'],
	},
	range: {
		package: '@suigar/range',
		packageName: 'range',
		types: ['RangeSettingsKey', 'Parameters'],
		functions: ['play_v2'],
	},
	soccer: {
		package: '@suigar/soccer',
		packageName: 'soccer',
		types: ['SoccerSettingsKey', 'SoccerConfig', 'Parameters'],
		functions: ['play_v2'],
	},
	wheel: {
		package: '@suigar/wheel',
		packageName: 'wheel',
		types: ['WheelSettingsKey', 'WheelConfig', 'Parameters'],
		functions: ['play_v2'],
	},
};
