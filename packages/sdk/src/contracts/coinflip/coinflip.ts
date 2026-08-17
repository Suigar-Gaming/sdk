import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
const $moduleName = '@suigar/coinflip::coinflip';
export const CoinFlipSettingsKey = new MoveStruct({
	name: `${$moduleName}::CoinFlipSettingsKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		house_edge: bcs.u64(),
		min_stake: bcs.u64(),
		max_stake: bcs.u64(),
	},
});
export interface PlayV2Options {
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
export function playV2(options: PlayV2Options) {
	const packageAddress = options.package ?? '@suigar/coinflip';
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
	] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'coinflip',
			function: 'play_v2',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
