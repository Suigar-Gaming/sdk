// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { buildCoinflipTransaction } from '../../../src/transactions/coinflip.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { loadTransactionModuleWithMock } from './utils.js';

describe('wheel transaction builder', () => {
	it('passes the validated wheel config id into the generated helper', async () => {
		const playV2 = createContractCallMock();
		const { buildWheelTransaction: buildWheelTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildWheelTransaction: (
					options: Record<string, unknown>,
				) => ReturnType<typeof buildCoinflipTransaction>;
			}>('../../../src/contracts/wheel/wheel.js', { playV2 }, '../../../src/transactions/wheel.js');

		buildWheelTransactionWithMock({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			configId: 9,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[4]).toBe(9);
	});

	it('rejects invalid wheel config ids', async () => {
		const { buildWheelTransaction } = await import('../../../src/transactions/wheel.js');

		expect(() =>
			buildWheelTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: -1,
				config: TEST_CONFIG,
			}),
		).toThrow('Value must be a u8 integer');
	});
});
