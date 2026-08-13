// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import {
	dynamicEntries,
	formatValue,
	labelFor,
	stringify,
	valueTone,
	visibleDefinitionEntries,
} from '../../src/app/src/lib/format.js';

describe('app format helpers', () => {
	it('formats display values and omits SDK-only companion fields', () => {
		expect(labelFor('gasBudgetMist')).toBe('Gas Budget Mist');
		expect(formatValue({ label: 'Coinflip', id: 'coinflip' })).toBe('Coinflip (coinflip)');
		expect(
			dynamicEntries({
				stake: '1000000',
				stake_display: '1 USDC',
				coin_type: '0x2::sui::SUI',
			}),
		).toEqual([['Stake', '1 USDC']]);
	});

	it('serializes bigint values and retains only displayable definition entries', () => {
		expect(stringify({ amount: 1n })).toContain('"amount": "1"');
		expect(
			visibleDefinitionEntries([
				['Present', 'value'],
				['Empty', ''],
				['Missing', null],
			]),
		).toEqual([['Present', 'value']]);
		expect(valueTone('Status', 'success')).toBe('success');
		expect(valueTone('Execution Error', 'pending')).toBe('error');
	});
});
