// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	SuigarCoinRegistry,
	SuigarNetworkRegistry,
} from '../types/suigar-config.type.js';
import { COINS as MAINNET_COINS } from './mainnet/coins.js';
import { COINS as TESTNET_COINS } from './testnet/coins.js';

export const COINS: SuigarNetworkRegistry<SuigarCoinRegistry> = {
	mainnet: { ...MAINNET_COINS },
	testnet: { ...TESTNET_COINS },
};
