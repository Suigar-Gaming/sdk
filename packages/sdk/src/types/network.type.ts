// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';

export type SuigarNetwork = Extract<
	SuiClientTypes.Network,
	'mainnet' | 'testnet'
>;

export const SUPPORTED_SUI_NETWORKS: SuigarNetwork[] = ['mainnet', 'testnet'];
