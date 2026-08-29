// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { PACKAGE_IDS as TESTNET_PACKAGE_IDS } from './src/configs/testnet/packages.ts';

interface SuigarPackageModule {
	module: string;
	types?: boolean | Array<string>;
	functions?: boolean | Array<string>;
}

interface SuigarPackage {
	package: string;
	packageName: string;
	modules: Array<SuigarPackageModule>;
}

export const SUIGAR_PACKAGES: Array<SuigarPackage> = [
	{
		package: TESTNET_PACKAGE_IDS.nftV1,
		packageName: 'nft-v1',
		modules: [
			{
				module: 'nft',
				types: ['Factory', 'Nft'],
				functions: ['mint_to_sender'],
			},
		],
	},
	{
		package: '@suigar/core',
		packageName: 'core',
		modules: [
			{
				module: 'core',
				types: ['BetResultEvent'],
				functions: false,
			},
			// {
			// 	module: 'sweethouse',
			// 	types: ['RedeemRequestCreatedEvent'],
			// 	functions: [
			// 		'deposit_public_pool_and_mint_staked_coins',
			// 		'redeem_request',
			// 		'claim_own_redeem_request_after_delay',
			// 	],
			// },
		],
	},
	{
		package: '@suigar/referral',
		packageName: 'referral',
		modules: [
			{
				module: 'referral',
				types: ['ReferrerClaimCommissionBalanceEvent', 'ReferrerClaimLevelUpUsdRewardsEvent'],
				functions: ['claim_commission_balance', 'claim_referrer_level_up_usd_rewards_v2'],
			},
		],
	},
	{
		package: '@suigar/coinflip',
		packageName: 'coinflip',
		modules: [
			{
				module: 'coinflip',
				types: ['CoinFlipSettingsKey', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
	{
		package: '0x84dcf017dab56b1ce4a1322d40c52a581abc24861abd549e829da75aa5570b6a',
		packageName: 'keno',
		modules: [
			{
				module: 'keno',
				types: ['KenoSettingsKey', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
	{
		package: '@suigar/limbo',
		packageName: 'limbo',
		modules: [
			{
				module: 'limbo',
				types: ['LimboSettingsKey', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
	{
		package: '@suigar/plinko',
		packageName: 'plinko',
		modules: [
			{
				module: 'plinko',
				types: ['PlinkoSettingsKey', 'PlinkoConfig', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
	{
		package: '@suigar/pvp-coinflip',
		packageName: 'pvp-coinflip',
		modules: [
			{
				module: 'pvp_coinflip',
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
		],
	},
	{
		package: '@suigar/range',
		packageName: 'range',
		modules: [
			{
				module: 'range',
				types: ['RangeSettingsKey', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
	{
		package: '@suigar/soccer',
		packageName: 'soccer',
		modules: [
			{
				module: 'soccer',
				types: ['SoccerSettingsKey', 'SoccerConfig', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
	{
		package: '@suigar/wheel',
		packageName: 'wheel',
		modules: [
			{
				module: 'wheel',
				types: ['WheelSettingsKey', 'WheelConfig', 'Parameters'],
				functions: ['play_v2'],
			},
		],
	},
];
