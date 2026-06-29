// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarCoinMetadataMap,
	SuigarNetworkRegistry,
	SuigarPackageIds,
	SuigarPriceInfoObjectIds,
} from '../types/suigar-config.type.js';
import {
	MAINNET_COINS,
	MAINNET_PACKAGE_IDS,
	MAINNET_PRICE_INFO_OBJECT_IDS,
} from './package.mainnet.js';
import {
	TESTNET_COINS,
	TESTNET_PACKAGE_IDS,
	TESTNET_PRICE_INFO_OBJECT_IDS,
} from './package.testnet.js';

export const PACKAGE_IDS: SuigarNetworkRegistry<SuigarPackageIds> = {
	mainnet: { ...MAINNET_PACKAGE_IDS },
	testnet: { ...TESTNET_PACKAGE_IDS },
};

export const COINS: SuigarNetworkRegistry<SuigarCoinMetadataMap> = {
	mainnet: { ...MAINNET_COINS },
	testnet: { ...TESTNET_COINS },
};

export const PRICE_INFO_OBJECT_IDS: SuigarNetworkRegistry<SuigarPriceInfoObjectIds> =
	{
		mainnet: { ...MAINNET_PRICE_INFO_OBJECT_IDS },
		testnet: { ...TESTNET_PRICE_INFO_OBJECT_IDS },
	};
