// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import type { buildSoccerTransaction } from '../../../src/transactions/soccer.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { loadTransactionModuleWithMock } from './utils.js';

describe('soccer transaction builder', () => {
	it('passes validated soccer selections into the generated helper', async () => {
		const playV2 = createContractCallMock();
		const { buildSoccerTransaction: buildSoccerTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildSoccerTransaction: typeof buildSoccerTransaction;
			}>(
				'../../../src/contracts/soccer/soccer.js',
				{ playV2 },
				'../../../src/transactions/soccer.js',
			);

		buildSoccerTransactionWithMock({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			configId: 9,
			countryId: 250,
			shotZoneId: 4,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package?: string;
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.package).toBe(TEST_CONFIG.packageIds.soccer);
		expect(options.arguments[0]).toBe(TEST_CONFIG.objectIds.sweetHouse);
		expect(options.arguments.slice(4, 7)).toEqual([9, 250, 4]);
	});

	it('rejects out-of-range soccer selections', async () => {
		const { buildSoccerTransaction } = await import('../../../src/transactions/soccer.js');

		expect(() =>
			buildSoccerTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: 256,
				countryId: 250,
				shotZoneId: 4,
				config: TEST_CONFIG,
			}),
		).toThrow('Value must be a u8 integer');
	});
});
