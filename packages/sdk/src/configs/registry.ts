// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarRegistryIds,
	SuiNetworkRegistry,
} from '../types/suigar-config.type.js';
import { MAINNET_REGISTRY_IDS } from './registry.mainnet.js';
import { TESTNET_REGISTRY_IDS } from './registry.testnet.js';

export const REGISTRY_IDS: SuiNetworkRegistry<SuigarRegistryIds> = {
	mainnet: { ...MAINNET_REGISTRY_IDS },
	testnet: { ...TESTNET_REGISTRY_IDS },
};
