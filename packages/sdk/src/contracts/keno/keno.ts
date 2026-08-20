import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
import * as float from './deps/0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc/float.js';
const $moduleName = '0x2efd6d200a2b6e70834fe98e3e25e9ede37fc4fae704d3f3ff0baa9b99d34c6c::keno';
export const KenoSettingsKey = new MoveStruct({
	name: `${$moduleName}::KenoSettingsKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const KenoConfig = new MoveStruct({
	name: `${$moduleName}::KenoConfig`,
	fields: {
		board_size: bcs.u8(),
		draw_count: bcs.u8(),
		min_picks: bcs.u8(),
		max_picks: bcs.u8(),
		paytable: bcs.vector(float.Float),
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
		max_payout: bcs.u64(),
		max_number_of_games: bcs.u64(),
		min_rtp: float.Float,
		max_rtp: float.Float,
		is_playable: bcs.bool(),
	},
});
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
		configs: vec_map.VecMap(bcs.u8(), KenoConfig),
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
		RawTransactionArgument<Array<number>>,
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
		RawTransactionArgument<string>,
	];
	typeArguments: [string];
}
export function playV2(options: PlayV2Options) {
	const packageAddress =
		options.package ?? '0x84dcf017dab56b1ce4a1322d40c52a581abc24861abd549e829da75aa5570b6a';
	const argumentsTypes = [
		null,
		'u64',
		null,
		'u64',
		'u8',
		'vector<u8>',
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
		null,
		'0x2::clock::Clock',
		'0x2::random::Random',
	] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'keno',
			function: 'play_v2',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
