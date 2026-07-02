// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	coinflipInputSchema,
	configInputSchema,
	pvpCoinflipJoinInputSchema,
	toolOutputSchema,
} from '../../src/tools/schemas.js';

describe('config input schema', () => {
	it('defaults to testnet and rejects unknown fields', () => {
		expect(configInputSchema.parse({})).toEqual({ network: 'testnet' });
		expect(() =>
			configInputSchema.parse({ network: 'testnet', extra: true }),
		).toThrow();
	});

	it('accepts only supported networks and valid provider URLs', () => {
		expect(configInputSchema.parse({ network: 'mainnet' }).network).toBe(
			'mainnet',
		);
		expect(() => configInputSchema.parse({ network: 'devnet' })).toThrow();
		expect(() =>
			configInputSchema.parse({ providerUrl: 'not-a-url' }),
		).toThrow();
	});
});

describe('build input schemas', () => {
	it('accepts decimal currency strings and rejects negative stake values', () => {
		expect(
			coinflipInputSchema.parse({
				mode: 'build',
				owner: '0x1',
				stake: '1.25',
				side: 'heads',
			}).stake,
		).toBe('1.25');
		expect(() => coinflipInputSchema.parse({ stake: -1 })).toThrow();
	});

	it('keeps PvP join game id optional for read-only planning', () => {
		expect(pvpCoinflipJoinInputSchema.parse({ mode: 'read-only' }).mode).toBe(
			'read-only',
		);
	});
});

describe('tool output schema', () => {
	it('accepts dry-run summaries and errors in tool output validation', () => {
		expect(() =>
			toolOutputSchema.parse({
				mode: 'dry-run',
				network: 'testnet',
				summary: {},
				dryRun: {},
				dryRunSummary: {
					success: true,
					error: null,
					gasUsed: {},
					balanceChanges: [],
					events: [],
				},
				errors: ['MoveAbort in coinflip::play'],
			}),
		).not.toThrow();
	});
});
