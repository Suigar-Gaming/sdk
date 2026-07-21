// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { InferBcsType } from '@mysten/bcs';
import { SuiClientTypes } from '@mysten/sui/client';
import {
	Parameters as CoinflipParameters,
	CoinFlipSettingsKey,
} from '../contracts/coinflip/coinflip.js';
import {
	Parameters as LimboParameters,
	LimboSettingsKey,
} from '../contracts/limbo/limbo.js';
import {
	Parameters as PlinkoParameters,
	PlinkoSettingsKey,
} from '../contracts/plinko/plinko.js';
import {
	Parameters as PvPCoinflipParameters,
	PvpCoinflipSettingsKey,
} from '../contracts/pvp-coinflip/pvp_coinflip.js';
import {
	Parameters as RangeParameters,
	RangeSettingsKey,
} from '../contracts/range/range.js';
import {
	Parameters as SoccerParameters,
	SoccerSettingsKey,
} from '../contracts/soccer/soccer.js';
import {
	Parameters as WheelParameters,
	WheelSettingsKey,
} from '../contracts/wheel/wheel.js';
import type { Game } from './game.type.js';
import type { MoveFloat } from './move-float.type.js';

export const GAME_SETTINGS = {
	coinflip: {
		settingsKey: CoinFlipSettingsKey,
		parameters: CoinflipParameters,
	},
	limbo: {
		settingsKey: LimboSettingsKey,
		parameters: LimboParameters,
	},
	plinko: {
		settingsKey: PlinkoSettingsKey,
		parameters: PlinkoParameters,
	},
	'pvp-coinflip': {
		settingsKey: PvpCoinflipSettingsKey,
		parameters: PvPCoinflipParameters,
	},
	range: {
		settingsKey: RangeSettingsKey,
		parameters: RangeParameters,
	},
	soccer: {
		settingsKey: SoccerSettingsKey,
		parameters: SoccerParameters,
	},
	wheel: {
		settingsKey: WheelSettingsKey,
		parameters: WheelParameters,
	},
} as const;

type OnChainGameParametersMap = {
	[TGame in Game]: InferBcsType<(typeof GAME_SETTINGS)[TGame]['parameters']>;
};

export type GameParameterValue<TValue> = TValue extends MoveFloat
	? number
	: TValue extends Array<infer TItem>
		? Array<GameParameterValue<TItem>>
		: TValue extends object
			? { [TKey in keyof TValue]: GameParameterValue<TValue[TKey]> }
			: TValue;

export type OnChainGameParameters<TGame extends Game> =
	OnChainGameParametersMap[TGame];

/** Consumer-ready parameters with generated Move float values decoded to numbers. */
export type GameParameters<TGame extends Game> = GameParameterValue<
	OnChainGameParameters<TGame>
>;

export type GetGameParametersOptions =
	SuiClientTypes.CoreClientMethodOptions & {
		coinType?: string;
		ignoreCache?: boolean;
	};
