/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = '@suigar/core::i64';
export const I64 = new MoveStruct({
	name: `${$moduleName}::I64`,
	fields: {
		bits: bcs.u64(),
	},
});
