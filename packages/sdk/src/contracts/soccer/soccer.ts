/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as float from './deps/0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc/float.js';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
const $moduleName = '@suigar/soccer::soccer';
export const SoccerSettingsKey = new MoveStruct({
	name: `${$moduleName}::SoccerSettingsKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const SoccerConfig = new MoveStruct({
	name: `${$moduleName}::SoccerConfig`,
	fields: {
		shot_zone_ids: bcs.vector(bcs.u8()),
		shot_zone_win_weights: bcs.vector(bcs.u64()),
		shot_zone_multipliers: bcs.vector(float.Float),
		shot_zone_goal_outcome_codes: bcs.vector(bcs.u16()),
		shot_zone_miss_outcome_codes: bcs.vector(bcs.u16()),
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
		is_playable: bcs.bool(),
	},
});
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
		max_number_of_shots: bcs.u64(),
		configs: vec_map.VecMap(bcs.u8(), SoccerConfig),
		countries: vec_map.VecMap(bcs.u16(), bcs.string()),
	},
});
export interface PlayV2Options {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<number>,
		RawTransactionArgument<number>,
		RawTransactionArgument<number>,
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
		RawTransactionArgument<string>,
	];
	typeArguments: [string];
}
export function playV2(options: PlayV2Options) {
	const packageAddress = options.package ?? '@suigar/soccer';
	const argumentsTypes = [
		null,
		'u64',
		null,
		'u64',
		'u8',
		'u16',
		'u8',
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
		null,
		'0x2::clock::Clock',
		'0x2::random::Random',
	] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'soccer',
			function: 'play_v2',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
