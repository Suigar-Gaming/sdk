// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarNetworkRegistry,
	SuigarRegistryIds,
} from '../types/index.js';
import { REGISTRY_IDS as MAINNET_REGISTRY_IDS } from './mainnet/registries.js';
import { REGISTRY_IDS as TESTNET_REGISTRY_IDS } from './testnet/registries.js';

export const REGISTRY_IDS: SuigarNetworkRegistry<SuigarRegistryIds> = {
	mainnet: { ...MAINNET_REGISTRY_IDS },
	testnet: { ...TESTNET_REGISTRY_IDS },
};
