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
        RawTransactionArgument<boolean>,
        RawTransactionArgument<Array<string>>,
        RawTransactionArgument<Array<Array<number>>>,
        RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function play(options: PlayOptions) {
    const packageAddress = options.package ?? '0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea';
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
        '0x2::random::Random'
    ] satisfies (string | null)[];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'coinflip',
        function: 'play',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        typeArguments: options.typeArguments
    });
}