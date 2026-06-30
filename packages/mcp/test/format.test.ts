// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { formatAmount, formatBaseUnitAmount } from '../src/format.js';

describe('amount formatting', () => {
	it.each([
		['1000000000', 9, '1'],
		['2000000000', 9, '2'],
		['1120000', 9, '0.00112'],
		['-9803836', 9, '-0.009803836'],
		['1234500', 6, '1.2345'],
		['42', 0, '42'],
		[0n, 9, '0'],
	])('formats %s with %i decimals as %s', (value, decimals, expected) => {
		expect(formatBaseUnitAmount(value, decimals)).toBe(expected);
	});

	it('uses 9 decimals by default for SUI-denominated values', () => {
		expect(formatBaseUnitAmount('50000000')).toBe('0.05');
	});

	it('passes through non-integer strings without decimal formatting', () => {
		expect(formatBaseUnitAmount('not-a-number', 9)).toBe('not-a-number');
		expect(formatBaseUnitAmount('1.5', 9)).toBe('1.5');
	});

	it('returns raw and display values for supported scalar inputs', () => {
		expect(formatAmount('1000000000', 9)).toEqual({
			raw: '1000000000',
			display: '1',
		});
		expect(formatAmount(1120000, 9)).toEqual({
			raw: '1120000',
			display: '0.00112',
		});
	});

	it('returns null for non-scalar amount values', () => {
		expect(formatAmount(null, 9)).toBeNull();
		expect(formatAmount({ raw: '1000' }, 9)).toBeNull();
		expect(formatAmount([1000], 9)).toBeNull();
	});
});
