// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { describe, expect, it, vi } from 'vitest';
import {
	executeSessionTransaction,
	getProviderUrl,
	normalizeNetwork,
	resolveDefaultCoinType,
	resolveOwnerAddress,
	type SuigarClientBundle,
} from '../../src/runtime/client.js';
import type { McpConfig } from '../../src/runtime/types.js';

const owner =
	'0x0000000000000000000000000000000000000000000000000000000000000001';
const resolvedOwner =
	'0x0000000000000000000000000000000000000000000000000000000000000002';

type ResolveNameServiceAddress =
	SuigarClientBundle['client']['core']['resolveNameServiceAddress'];

const createResolverBundle = (
	resolveNameServiceAddress: ResolveNameServiceAddress,
) =>
	({
		client: {
			core: {
				resolveNameServiceAddress,
			},
		},
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
			network: 'testnet',
			providerUrl: 'https://example.com',
			sdk: {
				coins: {
					sui: {
						coinType: '0x2::sui::SUI',
					},
				},
			},
		} as McpConfig;

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
		const lookup = vi.fn<ResolveNameServiceAddress>();

		await expect(
			resolveOwnerAddress('0x1', createResolverBundle(lookup)),
		).resolves.toBe(owner);
		expect(lookup).not.toHaveBeenCalled();
	});

	it('resolves SuiNS names and subnames before transaction construction', async () => {
		const lookup = vi
			.fn<ResolveNameServiceAddress>()
			.mockResolvedValue({ address: resolvedOwner });

		await expect(
			resolveOwnerAddress('furbor.sui', createResolverBundle(lookup)),
		).resolves.toBe(resolvedOwner);
		expect(lookup).toHaveBeenCalledWith({ name: 'furbor.sui' });

		await expect(
			resolveOwnerAddress('desk.furbor.sui', createResolverBundle(lookup)),
		).resolves.toBe(resolvedOwner);
		expect(lookup).toHaveBeenLastCalledWith({ name: 'desk.furbor.sui' });
	});

	it('rejects invalid or unresolved SuiNS owners with actionable errors', async () => {
		await expect(
			resolveOwnerAddress(
				'not a name',
				createResolverBundle(async () => ({ address: resolvedOwner })),
			),
		).rejects.toThrow(/Sui address or SuiNS name/u);

		await expect(
			resolveOwnerAddress(
				'missing.sui',
				createResolverBundle(async () => ({ address: null })),
			),
		).rejects.toThrow(/did not resolve/u);
	});
});

describe('session execution', () => {
	it('signs and submits with the supplied session signer', async () => {
		const signer = {
			toSuiAddress: () => owner,
		} as never;
		const signAndExecuteTransaction = vi
			.fn<(input: unknown) => Promise<unknown>>()
			.mockResolvedValue({
				$kind: 'Transaction',
				Transaction: {
					digest: 'session-digest',
					status: { success: true, error: null },
				},
			});
		const client = {
			signAndExecuteTransaction,
		};
		const transaction = new Transaction();

		await expect(
			executeSessionTransaction({
				transaction,
				client: client as never,
				signer,
			}),
		).resolves.toEqual({
			address: owner,
			digest: 'session-digest',
			status: 'success',
		});
		expect(client.signAndExecuteTransaction).toHaveBeenCalledWith({
			transaction,
			signer,
			include: { effects: true },
		});
	});

	it('reports an on-chain failed session execution without an approval flow', async () => {
		const signer = { toSuiAddress: () => owner } as never;
		const signAndExecuteTransaction = vi
			.fn<(input: unknown) => Promise<unknown>>()
			.mockResolvedValue({
				$kind: 'FailedTransaction',
				FailedTransaction: {
					digest: 'failed-digest',
					status: { success: false, error: { message: 'Insufficient gas' } },
				},
			});
		const client = {
			signAndExecuteTransaction,
		};

		await expect(
			executeSessionTransaction({
				transaction: new Transaction(),
				client: client as never,
				signer,
			}),
		).resolves.toEqual({
			address: owner,
			digest: 'failed-digest',
			status: 'failed',
			error: 'Insufficient gas',
		});
	});
});
