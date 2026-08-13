/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';

import { MoveStruct } from '../../../utils/index.js';

const $moduleName = '0x2::balance';
export const Balance = new MoveStruct({
	name: `${$moduleName}::Balance<phantom T0>`,
	fields: {
		value: bcs.u64(),
	},
});
