// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { parseToMist } from '@mysten/sui/utils';

export const DEFAULT_GAS_BUDGET_MIST = parseToMist('0.05');
export const DEFAULT_RANGE_SCALE = 1_000_000;
export const RANGE_POINT_LIMIT = DEFAULT_RANGE_SCALE * 100;
export const DEFAULT_LIMBO_MULTIPLIER_SCALE = 100;
