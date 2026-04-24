// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiNetwork } from '../types/network.type.js';
import type { SuigarRegistryId } from '../types/suigar-config.type.js';
import { PVP_COINFLIP_REGISTRY_ID as MAINNET_PVP_COINFLIP_REGISTRY_ID } from './registry.mainnet.js';
import { PVP_COINFLIP_REGISTRY_ID as TESTNET_PVP_COINFLIP_REGISTRY_ID } from './registry.testnet.js';

export const REGISTRY_IDS: Record<SuiNetwork, SuigarRegistryId> = {
	mainnet: {
		pvpCoinflip: MAINNET_PVP_COINFLIP_REGISTRY_ID,
	},
	testnet: {
		pvpCoinflip: TESTNET_PVP_COINFLIP_REGISTRY_ID,
	},
};
