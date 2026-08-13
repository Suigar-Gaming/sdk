// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { normalizeGameParameterValues } from '../../src/helpers/index.js';

describe('normalizeGameParameterValues', () => {
	it('decodes nested Move floats while preserving integer strings', () => {
		expect(
			normalizeGameParameterValues({
				min_stake: '1000',
				configs: [
					{
						multipliers: [{ mant: '1', exp: { bits: '52' }, is_negative: false }],
					},
				],
			}),
		).toEqual({ min_stake: '1000', configs: [{ multipliers: [1] }] });
	});
});
