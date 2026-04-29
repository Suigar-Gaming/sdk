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
        RawTransactionArgument<number>,
        RawTransactionArgument<Array<string>>,
        RawTransactionArgument<Array<Array<number>>>,
        RawTransactionArgument<string>
    ];
    typeArguments: [
        string
    ];
}
export function play(options: PlayOptions) {
    const packageAddress = options.package ?? '0x0997852ded7e13301c42317004bc49704a893aa82997c5706cebee59053a31b7';
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
        '0x2::random::Random'
    ] satisfies (string | null)[];
    return (tx: Transaction) => tx.moveCall({
        package: packageAddress,
        module: 'wheel',
        function: 'play',
        arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
        typeArguments: options.typeArguments
    });
}