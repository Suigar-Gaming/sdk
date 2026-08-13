/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
import * as float from './deps/0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc/float.js';

const $moduleName = '0x0997852ded7e13301c42317004bc49704a893aa82997c5706cebee59053a31b7::wheel';
export const WheelSettingsKey = new MoveStruct({
	name: `${$moduleName}::WheelSettingsKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const WheelConfig = new MoveStruct({
	name: `${$moduleName}::WheelConfig`,
	fields: {
		num_cases: bcs.u8(),
		multipliers: bcs.vector(float.Float),
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
		max_number_of_spins: bcs.u64(),
		configs: vec_map.VecMap(bcs.u8(), WheelConfig),
	},
});
export interface PlayOptions {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<number>,
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
		RawTransactionArgument<string>,
	];
	typeArguments: [string];
}
export function play(options: PlayOptions) {
	const packageAddress =
		options.package ?? '0x0997852ded7e13301c42317004bc49704a893aa82997c5706cebee59053a31b7';
	const argumentsTypes = [
		null,
		'u64',
		null,
		'u64',
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
			module: 'wheel',
			function: 'play',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
