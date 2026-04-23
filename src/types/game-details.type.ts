// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { BetResultEvent } from '../contracts/core/core';

export type BetResultGameDetails = ReturnType<
	(typeof BetResultEvent)['parse']
>['game_details'];

export type ParsedGameDetailValue = string | number | boolean;
export type ParsedGameDetails = Record<string, ParsedGameDetailValue>;

export type GameDetailValueType = 'u8' | 'u64' | 'bool' | 'float' | 'string';
export type GameDetailsSchema = Record<string, GameDetailValueType>;

const COINFLIP_GAME_DETAILS_SCHEMA = {
	player_bet: 'string',
	coin_outcome: 'string',
} satisfies GameDetailsSchema;

const PVP_COINFLIP_GAME_DETAILS_SCHEMA = {
	pvp_result: 'string',
} satisfies GameDetailsSchema;

const LIMBO_GAME_DETAILS_SCHEMA = {
	payout_amount: 'u64',
	win: 'bool',
	roll_multiplier: 'float',
	payout_multiplier: 'float',
	target_multiplier: 'float',
	actual_rtp: 'float',
} satisfies GameDetailsSchema;

const RANGE_GAME_DETAILS_SCHEMA = {
	roll_value: 'u64',
	win: 'bool',
	payout_amount: 'u64',
	payout_multiplier: 'float',
	left_point: 'u64',
	right_point: 'u64',
	zone_size: 'u64',
	winning_zone_size: 'u64',
	is_out_range: 'bool',
	bet_threshold: 'u64',
	roll_under: 'bool',
	range_mode: 'u8',
	win_probability: 'float',
	win_multiplier: 'float',
	actual_rtp: 'float',
} satisfies GameDetailsSchema;

const PLINKO_GAME_DETAILS_SCHEMA = {
	slot_index: 'u8',
	multiplier: 'float',
	payout_amount: 'u64',
	plinko_config: 'u8',
} satisfies GameDetailsSchema;

const WHEEL_GAME_DETAILS_SCHEMA = {
	case_index: 'u8',
	multiplier: 'float',
	payout_amount: 'u64',
	wheel_config: 'u8',
	spin_value: 'u64',
} satisfies GameDetailsSchema;

export const GAME_DETAILS_SCHEMA = {
	...COINFLIP_GAME_DETAILS_SCHEMA,
	...PVP_COINFLIP_GAME_DETAILS_SCHEMA,
	...LIMBO_GAME_DETAILS_SCHEMA,
	...RANGE_GAME_DETAILS_SCHEMA,
	...PLINKO_GAME_DETAILS_SCHEMA,
	...WHEEL_GAME_DETAILS_SCHEMA,
} satisfies GameDetailsSchema;
