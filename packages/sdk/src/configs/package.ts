// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarCoinRegistry,
	SuigarNetworkRegistry,
	SuigarPackageIds,
} from '../types/suigar-config.type.js';
import { MAINNET_COINS, MAINNET_PACKAGE_IDS } from './package.mainnet.js';
import { TESTNET_COINS, TESTNET_PACKAGE_IDS } from './package.testnet.js';

export const PACKAGE_IDS: SuigarNetworkRegistry<SuigarPackageIds> = {
	mainnet: { ...MAINNET_PACKAGE_IDS },
	testnet: { ...TESTNET_PACKAGE_IDS },
};

export const COINS: SuigarNetworkRegistry<SuigarCoinRegistry> = {
	mainnet: { ...MAINNET_COINS },
	testnet: { ...TESTNET_COINS },
};
