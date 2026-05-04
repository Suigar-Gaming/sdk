// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	Parameters as CoinflipParameters,
	CoinFlipSettingsKey,
} from '../contracts/coinflip/coinflip';
import {
	Parameters as LimboParameters,
	LimboSettingsKey,
} from '../contracts/limbo/limbo';
import {
	Parameters as PlinkoParameters,
	PlinkoSettingsKey,
} from '../contracts/plinko/plinko';
import {
	Parameters as PvPCoinflipParameters,
	PvpCoinflipSettingsKey,
} from '../contracts/pvp-coinflip/pvp_coinflip';
import {
	Parameters as RangeParameters,
	RangeSettingsKey,
} from '../contracts/range/range';
import {
	Parameters as WheelParameters,
	WheelSettingsKey,
} from '../contracts/wheel/wheel';
import type { Game } from './game.type.js';

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
	wheel: {
		settingsKey: WheelSettingsKey,
		parameters: WheelParameters,
	},
} as const;

export type GameParametersMap = {
	[TGame in Game]: ReturnType<
		(typeof GAME_SETTINGS)[TGame]['parameters']['parse']
	>;
};

export type GameParameters<TGame extends Game> = GameParametersMap[TGame];

export type GetGameParametersOptions = {
	coinType?: string;
	ignoreCache?: boolean;
	signal?: AbortSignal;
};
