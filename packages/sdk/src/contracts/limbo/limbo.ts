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
	'0x96c7841b9b32c59a219760fd656f1c3aceb53cc74a68ec9844a3a696374309f4::limbo';
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
		max_payout: bcs.u64(),
		min_target_multiplier: float.Float,
		max_target_multiplier: float.Float,
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
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
		RawTransactionArgument<string>,
	];
	typeArguments: [string];
}
export function play(options: PlayOptions) {
	const packageAddress =
		options.package ??
		'0x96c7841b9b32c59a219760fd656f1c3aceb53cc74a68ec9844a3a696374309f4';
	const argumentsTypes = [
		null,
		'u64',
		null,
		'u64',
		'u64',
		'u64',
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
		null,
		'0x2::clock::Clock',
		'0x2::random::Random',
	] satisfies (string | null)[];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'limbo',
			function: 'play',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
