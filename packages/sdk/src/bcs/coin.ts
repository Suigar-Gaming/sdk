// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';

// `Coin<T>` is a Sui framework type, not a Suigar Move struct, so it is not
// emitted by this package's Suigar codegen configuration.
export const CoinStruct = bcs.struct('Coin', {
	id: bcs.Address,
	balance: bcs.u64(),
});
