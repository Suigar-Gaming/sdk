// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import { describe, expect, it } from 'vitest';

import { parseGameDetails } from '../src/helpers/index.js';
import { BetResultGameDetails } from '../src/types/index.js';

function writeU64(value: bigint): number[] {
	const bytes = new Array<number>(8).fill(0);
	for (let index = 0; index < 8; index += 1) {
		bytes[index] = Number((value >> BigInt(8 * index)) & 0xffn);
	}
	return bytes;
}

function encodeFloat(value: number): number[] {
	if (value === 0) {
		return [0, ...writeU64(0n), ...writeU64(0n)];
	}

	const isNegative = value < 0;
	const magnitude = Math.abs(value);
	const exponent = Math.floor(Math.log2(magnitude));
	const mantissa = BigInt(Math.round(magnitude * Math.pow(2, 52 - exponent)));

	return [
		isNegative ? 1 : 0,
		...writeU64(BigInt(exponent)),
		...writeU64(mantissa),
	];
}

function encodeString(value: string): number[] {
	return Array.from(bcs.string().serialize(value).toBytes());
}

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
});
