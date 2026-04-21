/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { type BcsType, bcs } from '@mysten/sui/bcs';
import { MoveStruct } from '../utils/index.js';
import * as type_name from './deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
import * as float from './float.js';
import * as vec_map from './deps/0x0000000000000000000000000000000000000000000000000000000000000002/vec_map.js';
const $moduleName = '0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc::core';
export function BetResultEvent<T0 extends BcsType<any>>(...typeParameters: [
    T0
]) {
    return new MoveStruct({ name: `${$moduleName}::BetResultEvent<${typeParameters[0].name as T0['name']}>`, fields: {
            player: bcs.Address,
            coin_type: type_name.TypeName,
            stake_amount: bcs.u64(),
            unsafe_oracle_usd_coin_price: float.Float,
            adjusted_oracle_usd_coin_price: float.Float,
            outcome_amount: bcs.u64(),
            game_details: vec_map.VecMap(bcs.string(), bcs.vector(bcs.u8())),
            metadata: vec_map.VecMap(bcs.string(), bcs.vector(bcs.u8()))
        } });
}