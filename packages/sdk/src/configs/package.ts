// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarCoinTypes,
	SuigarPackage,
	SuigarPriceInfoObjectId,
	SuiNetworkMap,
} from '../types/suigar-config.type.js';
import {
	MAINNET_COIN_TYPES,
	MAINNET_PACKAGE_IDS,
	MAINNET_PRICE_INFO_OBJECT_IDS,
} from './package.mainnet.js';
import {
	TESTNET_COIN_TYPES,
	TESTNET_PACKAGE_IDS,
	TESTNET_PRICE_INFO_OBJECT_IDS,
} from './package.testnet.js';

export const PACKAGE_IDS: SuiNetworkMap<SuigarPackage> = {
	mainnet: { ...MAINNET_PACKAGE_IDS },
	testnet: { ...TESTNET_PACKAGE_IDS },
};

export const COIN_TYPES: SuiNetworkMap<SuigarCoinTypes> = {
	mainnet: { ...MAINNET_COIN_TYPES },
	testnet: { ...TESTNET_COIN_TYPES },
};

export const PRICE_INFO_OBJECT_IDS: SuiNetworkMap<SuigarPriceInfoObjectId> = {
	mainnet: { ...MAINNET_PRICE_INFO_OBJECT_IDS },
	testnet: { ...TESTNET_PRICE_INFO_OBJECT_IDS },
};
