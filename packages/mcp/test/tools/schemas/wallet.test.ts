// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { connectionInputSchema } from '../../../src/tools/schemas/wallet.js';

describe('wallet input schemas', () => {
	it.each([
		[
			'all bridge options',
			{
				network: 'mainnet',
				webUrl: 'http://localhost:5173',
				timeoutMs: 1000,
				maxBodyBytes: 2048,
				noOpen: true,
			},
			{
				network: 'mainnet',
				webUrl: 'http://localhost:5173',
				timeoutMs: 1000,
				maxBodyBytes: 2048,
				noOpen: true,
			},
		],
		['explicit open', { open: true, noOpen: false }, { open: true, noOpen: false }],
		['explicit no-open', { open: false, noOpen: true }, { open: false, noOpen: true }],
	])('accepts %s for connection tools', (_name, input, expected) => {
		expect(connectionInputSchema.parse(input)).toMatchObject(expected);
	});

	it.each([
		['invalid web URL', { webUrl: 'not-a-url' }, /Invalid URL/u],
		['non-positive timeout', { timeoutMs: 0 }, /Too small/u],
		['non-integer body size', { maxBodyBytes: 1.5 }, /expected int/u],
	])('rejects %s for connection tools', (_name, input, error) => {
		expect(() => connectionInputSchema.parse(input)).toThrow(error);
	});

	it.each([
		['open and no-open enabled', { open: true, noOpen: true }],
		['open and no-open disabled', { open: false, noOpen: false }],
	])('rejects %s with the quoted mutual exclusion message', (_name, input) => {
		const result = connectionInputSchema.safeParse(input);

		expect(result.success).toBe(false);
		expect(result.error?.issues[0]?.message).toBe('"open" and "noOpen" are mutually exclusive.');
	});
});
