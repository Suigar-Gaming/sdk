/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';
import { MoveStruct } from '../../../utils/index.js';

const $moduleName = '0x0000000000000000000000000000000000000000000000000000000000000001::type_name';
export const TypeName = new MoveStruct({
	name: `${$moduleName}::TypeName`,
	fields: {
		name: bcs.string(),
	},
});
