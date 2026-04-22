/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
const $moduleName = '0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202::pvp_coinflip';
export const GameCreatedEvent = new MoveStruct({ name: `${$moduleName}::GameCreatedEvent<phantom T0>`, fields: {
        game_id: bcs.Address,
        creator: bcs.Address,
        creator_is_tails: bcs.bool(),
        is_private: bcs.bool(),
        joiner_is_tails: bcs.bool(),
        stake_per_player: bcs.u64(),
        house_edge_bps: bcs.u64(),
        coin_type: type_name.TypeName
    } });
export const GameResolvedEvent = new MoveStruct({ name: `${$moduleName}::GameResolvedEvent<phantom T0>`, fields: {
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
        coin_type: type_name.TypeName
    } });
export const GameCancelledEvent = new MoveStruct({ name: `${$moduleName}::GameCancelledEvent<phantom T0>`, fields: {
        game_id: bcs.Address,
        creator: bcs.Address,
        creator_is_tails: bcs.bool(),
        is_private: bcs.bool(),
        stake_per_player: bcs.u64(),
        coin_type: type_name.TypeName
    } });
export interface CreateGameOptions {
    package?: string;
    arguments: [
        RawTransactionArgument<string>,
        RawTransactionArgument<string>,
        RawTransactionArgument<boolean>,
        RawTransactionArgument<boolean>,
        RawTransactionArgument<Array<string>>,
        RawTransactionArgument<Array<Array<number>>>
    ];
    typeArguments: [
        string
    ];
}
export function createGame(options: CreateGameOptions) {
    const packageAddress = options.package ?? '0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202';
    const argumentsTypes = [
        null,
        null,
        'bool',
        'bool',
        'vector<0x1::string::String>',
        'vector<vector<u8>>'
    ] satisfies (string | null)[];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pvp_coinflip',
        function: 'create_game',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        typeArguments: options.typeArguments
    });
}
export interface JoinGameOptions {
    package?: string;
    arguments: [
        RawTransactionArgument<string>,
        RawTransactionArgument<string>,
        RawTransactionArgument<string>,
        RawTransactionArgument<Array<string>>,
        RawTransactionArgument<Array<Array<number>>>,
        RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function joinGame(options: JoinGameOptions) {
    const packageAddress = options.package ?? '0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202';
    const argumentsTypes = [
        '0x2::object::ID',
        null,
        null,
        'vector<0x1::string::String>',
        'vector<vector<u8>>',
        null,
        '0x2::clock::Clock',
        '0x2::random::Random'
    ] satisfies (string | null)[];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pvp_coinflip',
        function: 'join_game',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        typeArguments: options.typeArguments
    });
}
export interface CancelGameOptions {
    package?: string;
    arguments: [
        RawTransactionArgument<string>,
        RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function cancelGame(options: CancelGameOptions) {
    const packageAddress = options.package ?? '0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202';
    const argumentsTypes = [
        '0x2::object::ID',
        null
    ] satisfies (string | null)[];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'pvp_coinflip',
        function: 'cancel_game',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        typeArguments: options.typeArguments
    });
}