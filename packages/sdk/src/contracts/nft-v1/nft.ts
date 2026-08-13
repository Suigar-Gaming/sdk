/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';
import { type Transaction } from '@mysten/sui/transactions';
import { MoveStruct, normalizeMoveArguments, type RawTransactionArgument } from '../utils/index.js';
import * as url from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/url.js';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';

const $moduleName = '0x196047539fdc2f1585d28dad9f4f2ccd50d23b21799ad0c88fa4e717d13b91a4::nft';
export const Spec = new MoveStruct({
	name: `${$moduleName}::Spec`,
	fields: {
		id: bcs.Address,
		name: bcs.string(),
		description: bcs.string(),
		url: url.Url,
		supply: bcs.u64(),
		available: bcs.u64(),
		price: bcs.u64(),
	},
});
export const Factory = new MoveStruct({
	name: `${$moduleName}::Factory`,
	fields: {
		id: bcs.Address,
		specs: vec_map.VecMap(bcs.Address, Spec),
	},
});
export const Nft = new MoveStruct({
	name: `${$moduleName}::Nft`,
	fields: {
		id: bcs.Address,
		spec_id: bcs.Address,
		name: bcs.string(),
		description: bcs.string(),
		url: url.Url,
		image_url: url.Url,
	},
});
export interface MintToSenderOptions {
	package?: string;
	arguments: [
		RawTransactionArgument<string>,
		RawTransactionArgument<string>,
		RawTransactionArgument<string>,
		RawTransactionArgument<string>,
	];
}
export function mintToSender(options: MintToSenderOptions) {
	const packageAddress =
		options.package ?? '0x196047539fdc2f1585d28dad9f4f2ccd50d23b21799ad0c88fa4e717d13b91a4';
	const argumentsTypes = [null, null, '0x2::object::ID', null] satisfies Array<string | null>;
	return (tx: Transaction) =>
		tx.moveCall({
			package: packageAddress,
			module: 'nft',
			function: 'mint_to_sender',
			arguments: normalizeMoveArguments(options.arguments, argumentsTypes),
		});
}
