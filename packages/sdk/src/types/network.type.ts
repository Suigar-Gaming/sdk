// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';

export const SUPPORTED_SUI_NETWORKS = [
	'mainnet',
	'testnet',
] as const satisfies readonly SuiClientTypes.Network[];

export type SuigarNetwork = (typeof SUPPORTED_SUI_NETWORKS)[number];
