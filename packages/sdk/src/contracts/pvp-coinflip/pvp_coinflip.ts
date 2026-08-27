/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
import * as balance from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/balance.js';
import * as type_name from './deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
const $moduleName = '@suigar/pvp-coinflip::pvp_coinflip';
export const PvpCoinflipSettingsKey = new MoveStruct({
	name: `${$moduleName}::PvpCoinflipSettingsKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const PvpCoinflipRegistryKey = new MoveStruct({
	name: `${$moduleName}::PvpCoinflipRegistryKey`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
export const Game = new MoveStruct({
	name: `${$moduleName}::Game<phantom T0>`,
	fields: {
		id: bcs.Address,
		creator: bcs.Address,
		creator_is_tails: bcs.bool(),
		is_private: bcs.bool(),
		creator_metadata: vec_map.VecMap(bcs.string(), bcs.vector(bcs.u8())),
		joiner: bcs.Address,
		winner: bcs.Address,
		stake_per_player: bcs.u64(),
		house_edge_bps: bcs.u64(),
		stake_pot: balance.Balance,
	},
});
export const GameCreatedEvent = new MoveStruct({
	name: `${$moduleName}::GameCreatedEvent<phantom T0>`,
	fields: {
		game_id: bcs.Address,
		creator: bcs.Address,
		creator_is_tails: bcs.bool(),
		is_private: bcs.bool(),
		joiner_is_tails: bcs.bool(),
		stake_per_player: bcs.u64(),
		house_edge_bps: bcs.u64(),
		coin_type: type_name.TypeName,
	},
});
export const GameResolvedEvent = new MoveStruct({
	name: `${$moduleName}::GameResolvedEvent<phantom T0>`,
	fields: {
		game_id: bcs.Address,
		creator: bcs.Address,
		joiner: bcs.Address,
		winner: bcs.Address,
		creator_is_tails: bcs.bool(),
		is_private: bcs.bool(),
		joiner_is_tails: bcs.bool(),
		stake_per_player: bcs.u64(),
		total_pot: bcs.u64(),
		house_edge_amount: bcs.u64(),
		payout_amount: bcs.u64(),
		coin_type: type_name.TypeName,
	},
});
export const GameCancelledEvent = new MoveStruct({
	name: `${$moduleName}::GameCancelledEvent<phantom T0>`,
	fields: {
		game_id: bcs.Address,
		creator: bcs.Address,
		creator_is_tails: bcs.bool(),
		is_private: bcs.bool(),
		stake_per_player: bcs.u64(),
		coin_type: type_name.TypeName,
	},
});
export const Parameters = new MoveStruct({
	name: `${$moduleName}::Parameters<phantom T0>`,
	fields: {
		id: bcs.Address,
		house_edge_bps: bcs.u64(),
		min_stake: bcs.u64(),
	},
});
export interface CreateGameOptions {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<string>,
		RawTransactionArgument<boolean>,
		RawTransactionArgument<boolean>,
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
	];
	typeArguments: [string];
}
export function createGame(options: CreateGameOptions) {
	const packageAddress = options.package ?? '@suigar/pvp-coinflip';
	const argumentsTypes = [
		null,
		null,
		'bool',
		'bool',
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
	] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'pvp_coinflip',
			function: 'create_game',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
export interface JoinGameV2Options {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<string>,
		RawTransactionArgument<string>,
		RawTransactionArgument<Array<string>>,
		RawTransactionArgument<Array<Array<number>>>,
		RawTransactionArgument<string>,
	];
	typeArguments: [string];
}
export function joinGameV2(options: JoinGameV2Options) {
	const packageAddress = options.package ?? '@suigar/pvp-coinflip';
	const argumentsTypes = [
		'0x2::object::ID',
		null,
		null,
		'vector<0x1::string::String>',
		'vector<vector<u8>>',
		null,
		'0x2::clock::Clock',
		'0x2::random::Random',
	] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'pvp_coinflip',
			function: 'join_game_v2',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
export interface CancelGameOptions {
	package?: string;
	arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	typeArguments: [string];
}
export function cancelGame(options: CancelGameOptions) {
	const packageAddress = options.package ?? '@suigar/pvp-coinflip';
	const argumentsTypes = ['0x2::object::ID', null] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'pvp_coinflip',
			function: 'cancel_game',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
