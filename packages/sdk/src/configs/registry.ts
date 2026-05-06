// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarRegistry,
	SuiNetworkMap,
} from '../types/suigar-config.type.js';
import { MAINNET_REGISTRY_IDS } from './registry.mainnet.js';
import { TESTNET_REGISTRY_IDS } from './registry.testnet.js';

export const REGISTRY_IDS: SuiNetworkMap<SuigarRegistry> = {
	mainnet: { ...MAINNET_REGISTRY_IDS },
	testnet: { ...TESTNET_REGISTRY_IDS },
};
