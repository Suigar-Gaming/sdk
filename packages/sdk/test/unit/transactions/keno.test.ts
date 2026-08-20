// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { buildCoinflipTransaction } from '../../../src/transactions/coinflip.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { loadTransactionModuleWithMock } from './utils.js';

describe('keno transaction builder', () => {
	it('passes the validated config id and picks into the generated helper', async () => {
		const playV2 = createContractCallMock();
		const { buildKenoTransaction: buildKenoTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildKenoTransaction: (
					options: Record<string, unknown>,
				) => ReturnType<typeof buildCoinflipTransaction>;
			}>('../../../src/contracts/keno/keno.js', { playV2 }, '../../../src/transactions/keno.js');

		buildKenoTransactionWithMock({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			configId: 2,
			picks: [1, 7, 20],
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[4]).toBe(2);
		expect(options.arguments[5]).toEqual([1, 7, 20]);
	});

	it('rejects invalid picks', async () => {
		const { buildKenoTransaction } = await import('../../../src/transactions/keno.js');

		expect(() =>
			buildKenoTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: 2,
				picks: [1, 256],
				config: TEST_CONFIG,
			}),
		).toThrow('Value must be a u8 integer');
	});
});
