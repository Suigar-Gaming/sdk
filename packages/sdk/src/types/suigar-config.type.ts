// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { SuiNetwork } from './network.type';

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

export type SuigarPackageKey =
	| 'sweetHouse'
	| 'core'
	| 'coinflip'
	| 'limbo'
	| 'plinko'
	| 'pvpCoinflip'
	| 'range'
	| 'wheel';
export type SuigarPackage = Record<SuigarPackageKey, string>;

export type SuigarRegistryKey = 'pvpCoinflip';
export type SuigarRegistry = Record<SuigarRegistryKey, string>;

export type SuigarPriceInfoObjectId = Record<SuigarCoin, string>;

export type SuiNetworkMap<T> = Record<SuiNetwork, T>;

export type SuigarConfig = {
	packageIds: SuigarPackage;
	registryIds: SuigarRegistry;
	coinTypes: SuigarCoinTypes;
	priceInfoObjectIds: SuigarPriceInfoObjectId;
};
