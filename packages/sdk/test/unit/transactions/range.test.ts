// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { buildCoinflipTransaction } from '../../../src/transactions/coinflip.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { loadTransactionModuleWithMock } from './utils.js';

describe('range transaction builder', () => {
	it('converts range points and out-of-range flag before calling the generated helper', async () => {
		const playV2 = createContractCallMock();
		const { buildRangeTransaction } = await loadTransactionModuleWithMock<{
			buildRangeTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>('../../../src/contracts/range/range.js', { playV2 }, '../../../src/transactions/range.js');

		buildRangeTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			leftPoint: 0.95,
			rightPoint: 1.05,
			outOfRange: true,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[4]).toBe(950000n);
		expect(options.arguments[5]).toBe(1050000n);
		expect(options.arguments[6]).toBe(true);
	});
});
