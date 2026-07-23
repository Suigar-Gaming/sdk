/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import {
	MoveStruct,
	normalizeMoveArguments,
	type RawTransactionArgument,
} from '../utils/index.js';
import * as float from './deps/0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc/float.js';

const $moduleName =
	'0x096a4cf18b3661e76b2c62b90785418345d52f45b272448794f123a4cb6b6416::range';
export const RangeSettingsKey = new MoveStruct({
	name: `${$moduleName}::RangeSettingsKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
		min_zone_size: bcs.u64(),
		max_zone_size: bcs.u64(),
		max_number_of_games: bcs.u64(),
		min_rtp: float.Float,
		max_rtp: float.Float,
	},
});
export interface PlayOptions {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<boolean>,
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
		RawTransactionArgument<string>,
	];
	typeArguments: [string];
}
export function play(options: PlayOptions) {
	const packageAddress =
		options.package ??
		'0x096a4cf18b3661e76b2c62b90785418345d52f45b272448794f123a4cb6b6416';
	const argumentsTypes = [
		null,
		'u64',
		null,
		'u64',
		'u64',
		'u64',
		'bool',
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
		null,
		'0x2::clock::Clock',
		'0x2::random::Random',
	] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'range',
			function: 'play',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
