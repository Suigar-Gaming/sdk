// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { configInputSchema } from '../../../src/tools/schemas/config.js';

describe('config input schema', () => {
	it('defaults to testnet and rejects unknown fields', () => {
		expect(configInputSchema.parse({})).toEqual({ network: 'testnet' });
		expect(() => configInputSchema.parse({ network: 'testnet', extra: true })).toThrow(
			/Unrecognized key/u,
		);
	});

	it('accepts only supported networks and valid provider URLs', () => {
		expect(configInputSchema.parse({ network: 'mainnet' }).network).toBe('mainnet');
		expect(() => configInputSchema.parse({ network: 'devnet' })).toThrow(/Invalid option/u);
		expect(() => configInputSchema.parse({ providerUrl: 'not-a-url' })).toThrow(/Invalid URL/u);
	});

	it('uses the SDK package and object override groups', () => {
		expect(
			configInputSchema.parse({
				config: {
					packageIds: { nftV1: '0xnft', referral: '0xreferral', soccer: '0xsoccer' },
					objectIds: { sweetHouse: '0xsweet-house' },
				},
			}),
		).toMatchObject({
			config: {
				packageIds: { nftV1: '0xnft', referral: '0xreferral', soccer: '0xsoccer' },
				objectIds: { sweetHouse: '0xsweet-house' },
			},
		});
	});

	it('accepts optional MVR package overrides', () => {
		expect(
			configInputSchema.parse({
				config: { packageIds: { referral: '0xreferral' } },
			}),
		).toMatchObject({ config: { packageIds: { referral: '0xreferral' } } });
	});
});
