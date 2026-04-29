// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';

export type SuiNetwork = Extract<SuiClientTypes.Network, 'mainnet' | 'testnet'>;

export const SUPPORTED_SUI_NETWORKS: SuiClientTypes.Network[] = [
	'mainnet',
	'testnet',
];
