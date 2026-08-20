// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { buildCoinflipTransaction } from '../../../src/transactions/coinflip.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { loadTransactionModuleWithMock } from './utils.js';

describe('limbo transaction builder', () => {
	it('converts target multiplier using the default scale', async () => {
		const playV2 = createContractCallMock();
		const { buildLimboTransaction } = await loadTransactionModuleWithMock<{
			buildLimboTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>('../../../src/contracts/limbo/limbo.js', { playV2 }, '../../../src/transactions/limbo.js');

		buildLimboTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			targetMultiplier: 2.5,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[4]).toBe(250n);
		expect(options.arguments[5]).toBe(100n);
	});

	it('respects a custom limbo scale', async () => {
		const playV2 = createContractCallMock();
		const { buildLimboTransaction } = await loadTransactionModuleWithMock<{
			buildLimboTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>('../../../src/contracts/limbo/limbo.js', { playV2 }, '../../../src/transactions/limbo.js');

		buildLimboTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			targetMultiplier: 2.5,
			scale: 1_000,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[4]).toBe(2500n);
		expect(options.arguments[5]).toBe(1000n);
	});
});
