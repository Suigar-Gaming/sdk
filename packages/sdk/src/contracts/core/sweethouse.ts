/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import * as type_name from './deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
const $moduleName = '@suigar/core::sweethouse';
export const RedeemRequestCreatedEvent = new MoveStruct({
	name: `${$moduleName}::RedeemRequestCreatedEvent`,
	fields: {
		request_id: bcs.Address,
		player: bcs.Address,
		coin_type: type_name.TypeName,
		staked_amount: bcs.u64(),
		created_at_ms: bcs.u64(),
	},
});
export interface DepositPublicPoolAndMintStakedCoinsOptions {
	package?: string;
	arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	typeArguments: [string];
}
export function depositPublicPoolAndMintStakedCoins(
	options: DepositPublicPoolAndMintStakedCoinsOptions,
) {
	const packageAddress = options.package ?? '@suigar/core';
	const argumentsTypes = [null, null] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'sweethouse',
			function: 'deposit_public_pool_and_mint_staked_coins',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
export interface RedeemRequestOptions {
	package?: string;
	arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	typeArguments: [string];
}
export function redeemRequest(options: RedeemRequestOptions) {
	const packageAddress = options.package ?? '@suigar/core';
	const argumentsTypes = [null, null, '0x2::clock::Clock'] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'sweethouse',
			function: 'redeem_request',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
export interface ClaimOwnRedeemRequestAfterDelayOptions {
	package?: string;
	arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	typeArguments: [string];
}
export function claimOwnRedeemRequestAfterDelay(options: ClaimOwnRedeemRequestAfterDelayOptions) {
	const packageAddress = options.package ?? '@suigar/core';
	const argumentsTypes = [null, '0x2::object::ID', '0x2::clock::Clock'] satisfies Array<
		string | null
	>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'sweethouse',
			function: 'claim_own_redeem_request_after_delay',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
