// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { BcsType, InferBcsType } from '@mysten/bcs';
import { bcs } from '@mysten/sui/bcs';
import type { BetResultEvent } from '../contracts/core/core.js';
import { Float } from '../contracts/core/float.js';
import type { Game } from './game.type.js';

export type BetResultGameDetails = InferBcsType<typeof BetResultEvent>['game_details'];

export type GameDetailValueType =
	| 'u8'
	| 'u16'
	| 'u32'
	| 'u64'
	| 'u128'
	| 'bool'
	| 'float'
	| 'string'
	| 'address';
export type GameDetailVectorValueType = `vector<${GameDetailValueType}>`;
export type GameDetailSchemaValueType = GameDetailValueType | GameDetailVectorValueType;
type GameDetailsSchema = Record<string, GameDetailSchemaValueType>;

type ScalarGameDetail<TValueType extends GameDetailValueType> = TValueType extends
	| 'float'
	| 'u64'
	| 'u128'
	? number
	: InferBcsType<(typeof GAME_DETAIL_BCS)[TValueType]>;

export type GameDetail<TValueType extends GameDetailSchemaValueType> =
	TValueType extends `vector<${infer TElementType extends GameDetailValueType}>`
		? Array<ScalarGameDetail<TElementType>>
		: ScalarGameDetail<TValueType & GameDetailValueType>;

export type GameDetails<TGame extends Game> = {
	[K in keyof (typeof GAME_DETAILS_SCHEMAS)[TGame]]: GameDetail<
		(typeof GAME_DETAILS_SCHEMAS)[TGame][K] & GameDetailSchemaValueType
	>;
};

export const GAME_DETAIL_BCS = {
	u8: bcs.U8,
	u16: bcs.U16,
	u32: bcs.U32,
	u64: bcs.U64,
	u128: bcs.U128,
	bool: bcs.Bool,
	float: Float,
	string: bcs.String,
	address: bcs.Address,
} as const satisfies Record<GameDetailValueType, BcsType<any>>;

const COINFLIP_GAME_DETAILS_SCHEMA = {
	player_bet: 'string',
	coin_outcome: 'string',
} satisfies GameDetailsSchema;

const KENO_GAME_DETAILS_SCHEMA = {
	keno_config: 'u8',
	board_size: 'u8',
	draw_count: 'u8',
	picks: 'vector<u8>',
	drawn_numbers: 'vector<u8>',
	hit_count: 'u8',
	multiplier: 'float',
	payout_amount: 'u64',
	actual_rtp: 'float',
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

const SOCCER_GAME_DETAILS_SCHEMA = {
	soccer_config: 'u8',
	outcome_code: 'u16',
	country_id: 'u16',
	shot_zone_id: 'u8',
	is_goal: 'bool',
	multiplier: 'float',
	payout_amount: 'u64',
	draw_value: 'u64',
} satisfies GameDetailsSchema;

export const GAME_DETAILS_SCHEMAS = {
	coinflip: COINFLIP_GAME_DETAILS_SCHEMA,
	keno: KENO_GAME_DETAILS_SCHEMA,
	limbo: LIMBO_GAME_DETAILS_SCHEMA,
	plinko: PLINKO_GAME_DETAILS_SCHEMA,
	'pvp-coinflip': PVP_COINFLIP_GAME_DETAILS_SCHEMA,
	range: RANGE_GAME_DETAILS_SCHEMA,
	soccer: SOCCER_GAME_DETAILS_SCHEMA,
	wheel: WHEEL_GAME_DETAILS_SCHEMA,
} satisfies Record<Game, GameDetailsSchema>;
