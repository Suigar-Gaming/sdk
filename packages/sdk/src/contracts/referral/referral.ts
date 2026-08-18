import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import * as type_name from './deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
import * as float from './deps/0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc/float.js';
const $moduleName = '@suigar/referral::referral';
export const ReferrerClaimCommissionBalanceEvent = new MoveStruct({
	name: `${$moduleName}::ReferrerClaimCommissionBalanceEvent<phantom T0>`,
	fields: {
		referrer: bcs.Address,
		amount: bcs.u64(),
	},
});
export const ReferrerClaimLevelUpUsdRewardsEvent = new MoveStruct({
	name: `${$moduleName}::ReferrerClaimLevelUpUsdRewardsEvent`,
	fields: {
		referrer: bcs.Address,
		usd_amount: float.Float,
		dollar_coin_type: type_name.TypeName,
		dollar_amount: bcs.u64(),
		dollar_coin_decimals: bcs.u8(),
		stablecoin_price: float.Float,
		stablecoin_confidence: float.Float,
		payout_price: float.Float,
	},
});
export interface ClaimCommissionBalanceOptions {
	package?: string;
	arguments: [RawTransactionArgument<string>];
	typeArguments: [string];
}
export function claimCommissionBalance(options: ClaimCommissionBalanceOptions) {
	const packageAddress = options.package ?? '@suigar/referral';
	const argumentsTypes = [null] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'referral',
			function: 'claim_commission_balance',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
export interface ClaimReferrerLevelUpUsdRewardsV2Options {
	package?: string;
	arguments: [RawTransactionArgument<string>, RawTransactionArgument<string>];
	typeArguments: [string];
}
export function claimReferrerLevelUpUsdRewardsV2(options: ClaimReferrerLevelUpUsdRewardsV2Options) {
	const packageAddress = options.package ?? '@suigar/referral';
	const argumentsTypes = [null, null, '0x2::clock::Clock'] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'referral',
			function: 'claim_referrer_level_up_usd_rewards_v2',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
			typeArguments: options.typeArguments,
		});
}
