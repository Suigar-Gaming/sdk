// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarNetworkRegistry,
	SuigarObjectIds,
} from '../types/suigar-config.type.js';
import { OBJECT_IDS as MAINNET_OBJECT_IDS } from './mainnet/objects.js';
import { OBJECT_IDS as TESTNET_OBJECT_IDS } from './testnet/objects.js';

export const OBJECT_IDS: SuigarNetworkRegistry<SuigarObjectIds> = {
	mainnet: { ...MAINNET_OBJECT_IDS },
	testnet: { ...TESTNET_OBJECT_IDS },
};
