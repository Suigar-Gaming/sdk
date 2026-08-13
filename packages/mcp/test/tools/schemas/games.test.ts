// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	coinflipInputSchema,
	pvpCoinflipJoinInputSchema,
	soccerInputSchema,
} from '../../../src/tools/schemas/games.js';

describe('game input schemas', () => {
	it('accepts decimal currency strings and rejects negative stake values', () => {
		const input = coinflipInputSchema.parse({
			mode: 'build',
			owner: '0x1',
			stake: '1.25',
			side: 'heads',
		});

		expect(input.stake).toBe('1.25');
		expect(input.network).toBe('testnet');
		expect(() => coinflipInputSchema.parse({ stake: -1 })).toThrow(/Too small/u);
	});

	it('defaults to connected execution and accepts direct session execution', () => {
		expect(coinflipInputSchema.parse({}).executionWallet).toBe('connected');
		expect(
			coinflipInputSchema.parse({
				mode: 'execute',
				executionWallet: 'session',
				stake: 1,
				side: 'heads',
			}),
		).toMatchObject({ mode: 'execute', executionWallet: 'session' });
	});

	it('keeps PvP join game id optional for read-only planning', () => {
		expect(pvpCoinflipJoinInputSchema.parse({ mode: 'read-only' }).mode).toBe('read-only');
	});

	it('bounds Soccer ids to their Move integer widths', () => {
		expect(
			soccerInputSchema.parse({
				configId: 255,
				countryId: 65_535,
				shotZoneId: 255,
			}),
		).toMatchObject({ countryId: 65_535 });
		expect(() => soccerInputSchema.parse({ countryId: 65_536 })).toThrow(/Too big/u);
	});
});
