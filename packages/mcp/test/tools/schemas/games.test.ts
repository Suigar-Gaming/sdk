// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	coinflipInputSchema,
	kenoInputSchema,
	pvpCoinflipJoinInputSchema,
	soccerInputSchema,
} from '../../../src/tools/schemas/games.js';

const testAddress = (fill: string) => `0x${fill.repeat(64)}`;
const owner = testAddress('a');
const gameId = testAddress('b');

describe('game input schemas', () => {
	it('accepts decimal currency strings and rejects negative stake values', () => {
		const input = coinflipInputSchema.parse({
			mode: 'build',
			owner,
			stake: '1.25',
			side: 'heads',
		});

		expect(input.stake).toBe('1.25');
		expect(input.network).toBe('testnet');
		expect(() => coinflipInputSchema.parse({ stake: -1 })).toThrow(/Too small/u);
	});

	it('defaults to connected execution and accepts direct session execution', () => {
		expect(coinflipInputSchema.parse({ owner, stake: 1, side: 'heads' }).executionWallet).toBe(
			'connected',
		);
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
		expect(() => pvpCoinflipJoinInputSchema.parse({ owner })).toThrow(/gameId is required/u);
		expect(pvpCoinflipJoinInputSchema.parse({ owner, gameId })).toMatchObject({ gameId });
	});

	it('bounds Soccer ids to their Move integer widths', () => {
		expect(
			soccerInputSchema.parse({
				owner,
				stake: 1,
				configId: 255,
				countryId: 65_535,
				shotZoneId: 255,
			}),
		).toMatchObject({ countryId: 65_535 });
		expect(() => soccerInputSchema.parse({ countryId: 65_536 })).toThrow(/Too big/u);
	});

	it('bounds Keno config and picks to u8 values', () => {
		expect(
			kenoInputSchema.parse({ owner, stake: 1, configId: 255, picks: [0, 255] }),
		).toMatchObject({
			configId: 255,
			picks: [0, 255],
		});
		expect(() => kenoInputSchema.parse({ picks: [256] })).toThrow(/Too big/u);
	});
});
