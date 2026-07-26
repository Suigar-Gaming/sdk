// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';

export const CoinStruct = bcs.struct('Coin', {
	id: bcs.Address,
	balance: bcs.u64(),
});
