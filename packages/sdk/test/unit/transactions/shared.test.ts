// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { describe, expect, it, vi } from 'vitest';
import { createBaseTransaction } from '../../../src/transactions/shared.js';
import { encodeUtf8, TEST_CONFIG } from '../../utils.js';
import { createZeroCoinThunk } from './utils.js';

describe('shared transaction helpers', () => {
	it('creates a base transaction with normalized owner address and configured gas budget', async () => {
		const tx = createBaseTransaction({
			owner: '0xabc',
			gasBudget: 999,
		});
		const data = tx.getData();

		expect(data.sender).toBe(normalizeSuiAddress('0xabc'));
		expect(data.gasData?.budget).toBe('999');
	});

	it('resolves standard game bet context before invoking the reward builder', async () => {
		const { buildSharedStandardGameBetTransaction } =
			await import('../../../src/transactions/shared.js');

		type RewardContext = Parameters<
			Parameters<typeof buildSharedStandardGameBetTransaction>[0]['buildRewardCoin']
		>[0];
		let context: RewardContext | undefined;

		const partner = normalizeSuiAddress('0x123');
		const tx = buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			cashStake: 2500,
			betCount: 3,
			metadata: {
				label: 'vip',
			},
			partner,
			useGasCoin: false,
			buildRewardCoin: (resolvedContext) => {
				context = resolvedContext;
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(tx.getData().commands).toHaveLength(2);
		expect(context!).toBeDefined();
		expect(context!.betCoin).toBeTypeOf('function');
		expect(context!.owner).toBe(normalizeSuiAddress('0xabc'));
		expect(context!.coinType).toBe(normalizeStructTag('0x2::sui::SUI'));
		expect(context!.stake).toBe(1000n);
		expect(context!.cashStake).toBe(2500n);
		expect(context!.betCount).toBe(3n);
		expect(context!.priceInfoObjectId).toBe(TEST_CONFIG.coins.sui.priceInfoObjectId);
		expect(context!.metadata).toEqual({
			keys: ['partner', 'label'],
			values: [Array.from(Buffer.from(partner.slice(2), 'hex')), encodeUtf8('vip')],
		});
	});

	it('does not default useGasCoin in Mysten coin intent options', async () => {
		const coinWithBalanceMock = vi.fn<
			({ type }: { type: string }) => ReturnType<typeof createZeroCoinThunk>
		>(({ type }) => createZeroCoinThunk(type));
		vi.doMock('@mysten/sui/transactions', async (importOriginal) => {
			const actual = await importOriginal<typeof import('@mysten/sui/transactions')>();
			return {
				...actual,
				coinWithBalance: coinWithBalanceMock,
			};
		});

		const { buildSharedStandardGameBetTransaction } =
			await import('../../../src/transactions/shared.js');

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			buildRewardCoin: (resolvedContext) => {
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(coinWithBalanceMock).toHaveBeenLastCalledWith({
			type: normalizeStructTag('0x2::sui::SUI'),
			balance: 1000n,
			useGasCoin: undefined,
		});

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			useGasCoin: false,
			buildRewardCoin: (resolvedContext) => {
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(coinWithBalanceMock).toHaveBeenLastCalledWith({
			type: normalizeStructTag('0x2::sui::SUI'),
			balance: 1000n,
			useGasCoin: false,
		});
	});

	it('warns and skips reserved metadata keys', async () => {
		const { buildSharedStandardGameBetTransaction } =
			await import('../../../src/transactions/shared.js');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			metadata: {
				referrer: '0x123',
				partner: 'manual',
				label: 'vip',
			},
			buildRewardCoin: (resolvedContext) => {
				expect(resolvedContext.metadata).toEqual({
					keys: ['label'],
					values: [encodeUtf8('vip')],
				});
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(warn).toHaveBeenCalledTimes(2);
		expect(warn).toHaveBeenNthCalledWith(
			1,
			'Metadata key "referrer" is reserved and will be ignored when parsing metadata.',
		);
		expect(warn).toHaveBeenNthCalledWith(
			2,
			'Metadata key "partner" is reserved and will be ignored when parsing metadata.',
		);
		warn.mockRestore();
	});

	it('encodes wallet addresses in non-reserved metadata values', async () => {
		const { buildSharedStandardGameBetTransaction } =
			await import('../../../src/transactions/shared.js');
		const accountManager = normalizeSuiAddress('0x456');

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			metadata: {
				accountManager,
				label: 'vip',
			},
			buildRewardCoin: (resolvedContext) => {
				expect(resolvedContext.metadata).toEqual({
					keys: ['accountManager', 'label'],
					values: [Array.from(Buffer.from(accountManager.slice(2), 'hex')), encodeUtf8('vip')],
				});
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});
	});
});
