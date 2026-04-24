// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { parseGameDetails } from '../src/utils/index.js';
import { BetResultGameDetails } from '../src/types/index.js';
import { encodeFloat, encodeString, writeU64 } from './utils.js';

function gameDetails(
	contents: Array<{ key: string; value: number[] }>,
): BetResultGameDetails {
	return { contents };
}

describe('parseGameDetails', () => {
	it('parses coinflip detail strings and preserves event keys', () => {
		expect(
			parseGameDetails(
				gameDetails([
					{ key: 'player_bet', value: encodeString('heads') },
					{ key: 'coin_outcome', value: encodeString('tails') },
					{ key: 'custom_label', value: encodeString('vip') },
				]),
			),
		).toEqual({
			player_bet: 'heads',
			coin_outcome: 'tails',
			custom_label: 'vip',
		});
	});

	it('parses numeric, boolean, and float range details', () => {
		const details = parseGameDetails(
			gameDetails([
				{ key: 'roll_value', value: writeU64(42n) },
				{ key: 'win', value: [1] },
				{ key: 'range_mode', value: [2] },
				{ key: 'payout_multiplier', value: encodeFloat(2.5) },
				{ key: 'actual_rtp', value: encodeFloat(0.97) },
			]),
		);

		expect(details).toMatchObject({
			roll_value: 42,
			win: true,
			range_mode: 2,
			payout_multiplier: 2.5,
		});
		expect(Number(details.actual_rtp)).toBeCloseTo(0.97);
	});

	it('parses pvp coinflip result details', () => {
		expect(
			parseGameDetails(
				gameDetails([{ key: 'pvp_result', value: encodeString('heads') }]),
			),
		).toEqual({ pvp_result: 'heads' });
	});

	it('parses raw UTF-8 pvp coinflip result details', () => {
		expect(
			parseGameDetails(
				gameDetails([{ key: 'pvp_result', value: [108, 111, 115, 115] }]),
			),
		).toEqual({ pvp_result: 'loss' });
	});
});
