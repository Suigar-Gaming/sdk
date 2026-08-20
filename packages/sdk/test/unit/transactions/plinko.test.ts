// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { buildCoinflipTransaction } from '../../../src/transactions/coinflip.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { loadTransactionModuleWithMock } from './utils.js';

describe('plinko transaction builder', () => {
	it('passes the validated config id into the generated helper', async () => {
		const playV2 = createContractCallMock();
		const { buildPlinkoTransaction: buildPlinkoTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPlinkoTransaction: (
					options: Record<string, unknown>,
				) => ReturnType<typeof buildCoinflipTransaction>;
			}>(
				'../../../src/contracts/plinko/plinko.js',
				{ playV2 },
				'../../../src/transactions/plinko.js',
			);

		buildPlinkoTransactionWithMock({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			configId: 7,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[4]).toBe(7);
	});

	it('rejects config ids outside the u8 range', async () => {
		const { buildPlinkoTransaction } = await import('../../../src/transactions/plinko.js');

		expect(() =>
			buildPlinkoTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: 256,
				config: TEST_CONFIG,
			}),
		).toThrow('Value must be a u8 integer');
	});
});
