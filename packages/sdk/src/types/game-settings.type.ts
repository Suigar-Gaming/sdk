// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { InferBcsType } from '@mysten/bcs';
import type { SuiClientTypes } from '@mysten/sui/client';
import {
	Parameters as CoinflipParameters,
	CoinFlipSettingsKey,
} from '../contracts/coinflip/coinflip.js';
import { Parameters as KenoParameters, KenoSettingsKey } from '../contracts/keno/keno.js';
import { Parameters as LimboParameters, LimboSettingsKey } from '../contracts/limbo/limbo.js';
import { Parameters as PlinkoParameters, PlinkoSettingsKey } from '../contracts/plinko/plinko.js';
import {
	Parameters as PvPCoinflipParameters,
	PvpCoinflipSettingsKey,
} from '../contracts/pvp-coinflip/pvp_coinflip.js';
import { Parameters as RangeParameters, RangeSettingsKey } from '../contracts/range/range.js';
import { Parameters as SoccerParameters, SoccerSettingsKey } from '../contracts/soccer/soccer.js';
import type { MoveStruct } from '../contracts/utils/index.js';
import { Parameters as WheelParameters, WheelSettingsKey } from '../contracts/wheel/wheel.js';
import type { Game } from './game.type.js';
import type { MoveFloat } from './move-float.type.js';
import type { SuigarPackage } from './suigar-config.type.js';
import type { WithCoinType, WithGame } from './transaction-options.type.js';

export const GAME_SETTINGS = {
	coinflip: {
		packageId: 'coinflip',
		settingsKey: CoinFlipSettingsKey,
		parameters: CoinflipParameters,
	},
	keno: {
		packageId: 'keno',
		settingsKey: KenoSettingsKey,
		parameters: KenoParameters,
	},
	limbo: {
		packageId: 'limbo',
		settingsKey: LimboSettingsKey,
		parameters: LimboParameters,
	},
	plinko: {
		packageId: 'plinko',
		settingsKey: PlinkoSettingsKey,
		parameters: PlinkoParameters,
	},
	'pvp-coinflip': {
		packageId: 'pvpCoinflip',
		settingsKey: PvpCoinflipSettingsKey,
		parameters: PvPCoinflipParameters,
	},
	range: {
		packageId: 'range',
		settingsKey: RangeSettingsKey,
		parameters: RangeParameters,
	},
	soccer: {
		packageId: 'soccer',
		settingsKey: SoccerSettingsKey,
		parameters: SoccerParameters,
	},
	wheel: {
		packageId: 'wheel',
		settingsKey: WheelSettingsKey,
		parameters: WheelParameters,
	},
} as const satisfies Record<
	Game,
	{ packageId: SuigarPackage; settingsKey: MoveStruct<any>; parameters: MoveStruct<any> }
>;

type OnChainGameParametersRegistry = {
	[TGame in Game]: InferBcsType<(typeof GAME_SETTINGS)[TGame]['parameters']>;
};

export type GameParameterValue<TValue> = TValue extends MoveFloat
	? number
	: TValue extends Array<infer TItem>
		? Array<GameParameterValue<TItem>>
		: TValue extends object
			? { [TKey in keyof TValue]: GameParameterValue<TValue[TKey]> }
			: TValue;

export type OnChainGameParameters<TGame extends Game> = OnChainGameParametersRegistry[TGame];

/** Consumer-ready parameters with generated Move float values decoded to numbers. */
export type GameParameters<TGame extends Game> = GameParameterValue<OnChainGameParameters<TGame>>;

/** Options for reading parameters. `coinType` is required because parameters are coin-specific. */
export type GetGameParametersOptions<TGame extends Game = Game> = WithGame<
	WithCoinType<
		SuiClientTypes.CoreClientMethodOptions & {
			ignoreCache?: boolean;
		}
	>,
	TGame
>;
