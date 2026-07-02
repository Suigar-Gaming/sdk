// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';
import {
	getProviderUrl,
	normalizeNetwork,
	resolveDefaultCoinType,
	resolveOwnerAddress,
} from '../../src/runtime/client.js';
import type { SuigarClientBundle } from '../../src/runtime/client.js';
import type { ResolvedMcpConfig } from '../../src/runtime/types.js';

const owner =
	'0x0000000000000000000000000000000000000000000000000000000000000001';
const resolvedOwner =
	'0x0000000000000000000000000000000000000000000000000000000000000002';

const createResolverBundle = (
	resolveSuiNSName: SuigarClientBundle['resolveSuiNSName'],
) =>
	({
		resolveSuiNSName,
	}) as SuigarClientBundle;

describe('network resolution', () => {
	it('defaults to testnet and accepts supported networks', () => {
		expect(normalizeNetwork()).toBe('testnet');
		expect(normalizeNetwork('mainnet')).toBe('mainnet');
		expect(normalizeNetwork('testnet')).toBe('testnet');
	});

	it('rejects unsupported networks with an actionable error', () => {
		expect(() => normalizeNetwork('devnet')).toThrow(/mainnet.*testnet/u);
	});

	it('uses default provider URLs unless one is provided', () => {
		expect(getProviderUrl('testnet')).toBe(
			'https://fullnode.testnet.sui.io:443',
		);
		expect(getProviderUrl('mainnet', 'https://example.com')).toBe(
			'https://example.com',
		);
	});
});

describe('coin type resolution', () => {
	it('normalizes explicit and configured default coin types', () => {
		const config = {
			sdk: {
				coins: {
					sui: {
						coinType: '0x2::sui::SUI',
					},
				},
			},
		} as ResolvedMcpConfig;

		expect(resolveDefaultCoinType(config)).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
		expect(resolveDefaultCoinType(config, '0x2::coin::COIN')).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::coin::COIN',
		);
	});
});

describe('owner resolution', () => {
	it('normalizes raw Sui addresses without a SuiNS lookup', async () => {
		const lookup = vi.fn<SuigarClientBundle['resolveSuiNSName']>();

		await expect(
			resolveOwnerAddress('0x1', createResolverBundle(lookup)),
		).resolves.toBe(owner);
		expect(lookup).not.toHaveBeenCalled();
	});

	it('resolves SuiNS names and subnames before transaction construction', async () => {
		const lookup = vi
			.fn<SuigarClientBundle['resolveSuiNSName']>()
			.mockResolvedValue(resolvedOwner);

		await expect(
			resolveOwnerAddress('furbor.sui', createResolverBundle(lookup)),
		).resolves.toBe(resolvedOwner);
		expect(lookup).toHaveBeenCalledWith('furbor.sui');

		await expect(
			resolveOwnerAddress('desk.furbor.sui', createResolverBundle(lookup)),
		).resolves.toBe(resolvedOwner);
		expect(lookup).toHaveBeenLastCalledWith('desk.furbor.sui');
	});

	it('rejects invalid or unresolved SuiNS owners with actionable errors', async () => {
		await expect(
			resolveOwnerAddress(
				'not a name',
				createResolverBundle(async () => resolvedOwner),
			),
		).rejects.toThrow(/Sui address or SuiNS name/u);

		await expect(
			resolveOwnerAddress(
				'missing.sui',
				createResolverBundle(async () => null),
			),
		).rejects.toThrow(/did not resolve/u);
	});
});
