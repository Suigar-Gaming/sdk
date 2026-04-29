/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { type Transaction } from '@mysten/sui/transactions';
import { normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
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
        RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function play(options: PlayOptions) {
    const packageAddress = options.package ?? '0x96c7841b9b32c59a219760fd656f1c3aceb53cc74a68ec9844a3a696374309f4';
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
        '0x2::random::Random'
    ] satisfies (string | null)[];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'limbo',
        function: 'play',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        typeArguments: options.typeArguments
    });
}