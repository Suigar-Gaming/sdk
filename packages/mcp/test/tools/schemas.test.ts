// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	buildReferralCommissionClaimTransactionInputSchema,
	coinflipInputSchema,
	configInputSchema,
	getReferralCommissionInputSchema,
	pvpCoinflipJoinInputSchema,
	soccerInputSchema,
	toolOutputSchema,
} from '../../src/tools/schemas.js';

describe('config input schema', () => {
	it('defaults to testnet and rejects unknown fields', () => {
		expect(configInputSchema.parse({})).toEqual({ network: 'testnet' });
		expect(() =>
			configInputSchema.parse({ network: 'testnet', extra: true }),
		).toThrow(/Unrecognized key/u);
	});

	it('accepts only supported networks and valid provider URLs', () => {
		expect(configInputSchema.parse({ network: 'mainnet' }).network).toBe(
			'mainnet',
		);
		expect(() => configInputSchema.parse({ network: 'devnet' })).toThrow(
			/Invalid option/u,
		);
		expect(() => configInputSchema.parse({ providerUrl: 'not-a-url' })).toThrow(
			/Invalid URL/u,
		);
	});

	it('uses the SDK package, object, and registry override groups', () => {
		expect(
			configInputSchema.parse({
				config: {
					packageIds: { referral: '0xreferral', soccer: '0xsoccer' },
					objectIds: { sweetHouse: '0xsweet-house' },
					registryIds: { pvpCoinflip: '0xpvp-registry' },
				},
			}),
		).toMatchObject({
			config: {
				packageIds: { soccer: '0xsoccer' },
				objectIds: { sweetHouse: '0xsweet-house' },
				registryIds: { pvpCoinflip: '0xpvp-registry' },
			},
		});
	});

	it('accepts a referral package override', () => {
		expect(
			configInputSchema.parse({
				config: { packageIds: { referral: '0xreferral' } },
			}),
		).toMatchObject({ config: { packageIds: { referral: '0xreferral' } } });
	});
});

describe('build input schemas', () => {
	it('accepts decimal currency strings and rejects negative stake values', () => {
		const input = coinflipInputSchema.parse({
			mode: 'build',
			owner: '0x1',
			stake: '1.25',
			side: 'heads',
		});

		expect(input.stake).toBe('1.25');
		expect(input.network).toBe('testnet');
		expect(() => coinflipInputSchema.parse({ stake: -1 })).toThrow(
			/Too small/u,
		);
	});

	it('keeps PvP join game id optional for read-only planning', () => {
		expect(pvpCoinflipJoinInputSchema.parse({ mode: 'read-only' }).mode).toBe(
			'read-only',
		);
	});

	it('requires a referrer owner for claim reads and permits read-only claim planning', () => {
		expect(() => getReferralCommissionInputSchema.parse({})).toThrow(
			/expected string/u,
		);
		expect(
			buildReferralCommissionClaimTransactionInputSchema.parse({
				mode: 'read-only',
			}),
		).toMatchObject({ mode: 'read-only' });
	});

	it('bounds Soccer ids to their Move integer widths', () => {
		expect(
			soccerInputSchema.parse({
				configId: 255,
				countryId: 65_535,
				shotZoneId: 255,
			}),
		).toMatchObject({ countryId: 65_535 });
		expect(() => soccerInputSchema.parse({ countryId: 65_536 })).toThrow(
			/Too big/u,
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
