// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { parseToMist } from '@mysten/sui/utils';

export const DEFAULT_GAS_BUDGET_MIST = parseToMist('0.05');
export const RANGE_POINT_LIMIT = 100_000_000;
export const RANGE_FIXED_POINT_SCALE = 1_000_000;
export const DEFAULT_RANGE_SCALE = RANGE_FIXED_POINT_SCALE;
export const LIMBO_MULTIPLIER_SCALE = 100;
