import { bcs } from '@mysten/sui/bcs';
/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import * as i64 from './i64.js';
const $moduleName = '@suigar/core::float';
export const Float = new MoveStruct({
	name: `${$moduleName}::Float`,
	fields: {
		is_negative: bcs.bool(),
		exp: i64.I64,
		mant: bcs.u64(),
	},
});
