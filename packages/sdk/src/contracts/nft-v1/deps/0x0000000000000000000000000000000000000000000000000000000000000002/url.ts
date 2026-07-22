/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { bcs } from '@mysten/sui/bcs';
import { MoveStruct } from '../../../utils/index.js';

const $moduleName = '0x2::url';
export const Url = new MoveStruct({
	name: `${$moduleName}::Url`,
	fields: {
		url: bcs.string(),
	},
});
