/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
const $moduleName = '@suigar/core::house';
export const StakedCoin = new MoveStruct({
	name: `${$moduleName}::StakedCoin<phantom T0>`,
	fields: {
		dummy_field: bcs.bool(),
	},
});
