// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { SuiNetwork } from './network.type.js';

export interface SuigarExtensionOptions<Name = 'suigar'> {
	name?: Name;
	/**
	 * Partner wallet address injected into bet metadata for attribution.
	 *
	 * Configure this once when registering the `suigar()` client extension
	 * instead of passing partner data through per-transaction metadata.
	 */
	partner?: string;
	/**
	 * Cache TTL in milliseconds for SDK-managed on-chain config lookups.
	 *
	 * Defaults to 30 minutes.
	 */
	cacheTtl?: number;
}

export type SuigarCoin = 'sui' | 'usdc';

export type SuigarCoinTypes = Record<SuigarCoin, string>;

export type SuigarPackage =
	| 'sweetHouse'
	| 'core'
	| 'coinflip'
	| 'limbo'
	| 'plinko'
	| 'pvpCoinflip'
	| 'range'
	| 'wheel';
export type SuigarPackageIds = Record<SuigarPackage, string>;

export type SuigarRegistry = 'pvpCoinflip';
export type SuigarRegistryIds = Record<SuigarRegistry, string>;

export type SuigarPriceInfoObjectIds = Record<SuigarCoin, string>;

export type SuiNetworkRegistry<TRegistry> = Record<SuiNetwork, TRegistry>;

export type SuigarConfig = {
	packageIds: SuigarPackageIds;
	registryIds: SuigarRegistryIds;
	coinTypes: SuigarCoinTypes;
	priceInfoObjectIds: SuigarPriceInfoObjectIds;
};
