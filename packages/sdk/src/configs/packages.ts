// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarNetworkRegistry,
	SuigarPackageIds,
} from '../types/index.js';
import { PACKAGE_IDS as MAINNET_PACKAGE_IDS } from './mainnet/packages.js';
import { PACKAGE_IDS as TESTNET_PACKAGE_IDS } from './testnet/packages.js';

export const PACKAGE_IDS: SuigarNetworkRegistry<SuigarPackageIds> = {
	mainnet: { ...MAINNET_PACKAGE_IDS },
	testnet: { ...TESTNET_PACKAGE_IDS },
};
