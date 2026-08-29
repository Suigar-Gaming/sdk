/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import * as type_name from './deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
import * as float from './float.js';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
const $moduleName = '@suigar/core::core';
export const BetResultEvent = new MoveStruct({
	name: `${$moduleName}::BetResultEvent<phantom T0>`,
	fields: {
		player: bcs.Address,
		coin_type: type_name.TypeName,
		stake_amount: bcs.u64(),
		unsafe_oracle_usd_coin_price: float.Float,
		adjusted_oracle_usd_coin_price: float.Float,
		outcome_amount: bcs.u64(),
		game_details: vec_map.VecMap(bcs.string(), bcs.vector(bcs.u8())),
		metadata: vec_map.VecMap(bcs.string(), bcs.vector(bcs.u8())),
	},
});
