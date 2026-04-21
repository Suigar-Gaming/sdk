/**************************************************************
 * THIS FILE IS GENERATED AND SHOULD NOT BE MANUALLY MODIFIED *
 **************************************************************/
import { MoveStruct } from '../utils/index.js';
import { bcs } from '@mysten/sui/bcs';
import * as i64 from './i64.js';
const $moduleName = '0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc::float';
export const Float = new MoveStruct({ name: `${$moduleName}::Float`, fields: {
        is_negative: bcs.bool(),
        exp: i64.I64,
        mant: bcs.u64()
    } });