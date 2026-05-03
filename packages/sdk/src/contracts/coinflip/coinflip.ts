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

const $moduleName =
	'0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea::coinflip';
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		house_edge: bcs.u64(),
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
	},
});
export interface PlayOptions {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<number | bigint>,
		RawTransactionArgument<string>,
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
		'0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea';
	const argumentsTypes = [
		null,
		'u64',
		null,
		'u64',
		'bool',
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
		null,
		'0x2::clock::Clock',
		'0x2::random::Random',
	] satisfies (string | null)[];
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'coinflip',
			function: 'play',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
