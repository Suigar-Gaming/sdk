// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { SuigarNetwork } from './network.type.js';

export type SuigarCoinMetadata = {
	coinType: string;
	decimals: number;
	priceInfoObjectId: string;
};

export type SuigarConfigOverrides = {
	packageIds?: Partial<SuigarPackageIds>;
	registryIds?: Partial<SuigarRegistryIds>;
	coins?: Partial<Record<SuigarCoin, Partial<SuigarCoinMetadata>>>;
};

export interface SuigarExtensionOptions<Name = 'suigar'> {
	name?: Name;
	/**
	 * Network-resolved configuration overrides.
	 *
	 * Use this to patch package ids, registry ids, supported coins, or price
	 * info object ids when on-chain deployments move faster than the published
	 * SDK defaults.
	 */
	config?: SuigarConfigOverrides;
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

export type SuigarCoinRegistry = Record<SuigarCoin, SuigarCoinMetadata>;

export type SuigarPackage =
	| 'sweetHouse'
	| 'legacyNft'
	| 'legacyNftFactory'
	| 'core'
	| 'coinflip'
	| 'limbo'
	| 'plinko'
	| 'pvpCoinflip'
	| 'range'
	| 'soccer'
	| 'wheel';
export type SuigarPackageIds = Record<SuigarPackage, string>;

export type SuigarRegistry = 'pvpCoinflip';
export type SuigarRegistryIds = Record<SuigarRegistry, string>;

export type SuigarNetworkRegistry<TRegistry> = Record<SuigarNetwork, TRegistry>;

export type SuigarConfig = {
	packageIds: SuigarPackageIds;
	registryIds: SuigarRegistryIds;
	coins: SuigarCoinRegistry;
};
