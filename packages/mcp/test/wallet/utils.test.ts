// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { resolvePositiveInteger } from '../../src/wallet/utils.js';

describe('wallet utilities', () => {
	it('returns the default for empty values', () => {
		expect(resolvePositiveInteger(undefined, 'Timeout', 1000)).toBe(1000);
		expect(resolvePositiveInteger('', 'Timeout', 1000)).toBe(1000);
	});

	it('accepts positive integer numbers and strings', () => {
		expect(resolvePositiveInteger(2500, 'Timeout', 1000)).toBe(2500);
		expect(resolvePositiveInteger('2500', 'Timeout', 1000)).toBe(2500);
	});

	it('rejects non-positive and non-integer values', () => {
		for (const value of [0, -1, 1.5, '0', '-1', '1.5', 'abc']) {
			expect(() => resolvePositiveInteger(value, 'Timeout', 1000)).toThrow(
				new RangeError('Timeout must be a positive integer.'),
			);
		}
	});
});
