// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, expectTypeOf, it } from 'vitest';
import { BetResultGameDetails } from '../../src/types/index.js';
import {
	parseCoinType,
	parseGameDetails,
	toBigInt,
	toU8,
	toU16,
} from '../../src/utils/index.js';
import { encodeFloat, encodeString, writeU64 } from './utils.js';

function gameDetails(
	contents: Array<{ key: string; value: number[] }>,
): BetResultGameDetails {
	return { contents };
}

describe('parseCoinType', () => {
	const suiCoinType =
		'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';

	it('extracts and normalizes the first generic coin type', () => {
		expect(
			parseCoinType(
				'0x1::pvp_coinflip::Game<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>',
			),
		).toBe(suiCoinType);
	});

	it('throws when the object type does not include a generic coin type', () => {
		expect(() => parseCoinType('0x1::pvp_coinflip::Game')).toThrow(
			'Unable to parse coin type',
		);
	});
});

describe('parseGameDetails', () => {
	it('parses coinflip detail strings and preserves event keys', () => {
		expect(
			parseGameDetails(
				'coinflip',
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
			'range',
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
				'pvp-coinflip',
				gameDetails([{ key: 'pvp_result', value: encodeString('heads') }]),
			),
		).toEqual({ pvp_result: 'heads' });
	});

	it('parses raw UTF-8 pvp coinflip result details', () => {
		expect(
			parseGameDetails(
				'pvp-coinflip',
				gameDetails([{ key: 'pvp_result', value: [108, 111, 115, 115] }]),
			),
		).toEqual({ pvp_result: 'loss' });
	});

	it('narrows the parsed detail keys and value types by game id', () => {
		const coinflipDetails = parseGameDetails(
			'coinflip',
			gameDetails([
				{ key: 'player_bet', value: encodeString('heads') },
				{ key: 'coin_outcome', value: encodeString('tails') },
			]),
		);

		expectTypeOf(coinflipDetails).toEqualTypeOf<{
			player_bet: string;
			coin_outcome: string;
		}>();
		expectTypeOf(coinflipDetails.player_bet).toEqualTypeOf<string>();
		expectTypeOf(coinflipDetails.coin_outcome).toEqualTypeOf<string>();
	});
});

describe('toBigInt', () => {
	it('accepts bigint, number, integer string, and boolean inputs', () => {
		expect(toBigInt(5n)).toBe(5n);
		expect(toBigInt(5)).toBe(5n);
		expect(toBigInt(5.9)).toBe(5n);
		expect(toBigInt('5')).toBe(5n);
		expect(toBigInt('0005')).toBe(5n);
		expect(toBigInt(true)).toBe(1n);
		expect(toBigInt(false)).toBe(0n);
	});

	it('rejects unsupported input types', () => {
		expect(() => toBigInt(null)).toThrow(
			'Value must be a bigint, number, integer string, or boolean',
		);
	});

	it('rejects invalid string inputs', () => {
		expect(() => toBigInt('5.1')).toThrow(
			'Value must be a bigint, number, integer string, or boolean',
		);
		expect(() => toBigInt('1e3')).toThrow(
			'Value must be a bigint, number, integer string, or boolean',
		);
	});

	it('rejects non-finite numbers', () => {
		expect(() => toBigInt(Number.NaN)).toThrow(
			'Value must be a bigint, number, integer string, or boolean',
		);
		expect(() => toBigInt(Number.POSITIVE_INFINITY)).toThrow(
			'Value must be a bigint, number, integer string, or boolean',
		);
	});

	it('rejects negative values', () => {
		expect(() => toBigInt(-1)).toThrow('Value must be non-negative');
		expect(() => toBigInt(-1n)).toThrow('Value must be non-negative');
		expect(() => toBigInt('-1')).toThrow('Value must be non-negative');
	});
});

describe('toU8', () => {
	it('accepts valid u8 numbers and integer strings', () => {
		expect(toU8(0)).toBe(0);
		expect(toU8(255)).toBe(255);
		expect(toU8('1')).toBe(1);
		expect(toU8('001')).toBe(1);
	});

	it('rejects unsupported input types', () => {
		expect(() => toU8(undefined)).toThrow(
			'Value must be a finite number or integer string',
		);
		expect(() => toU8(true)).toThrow('Value must be a u8 integer');
	});

	it('rejects non-finite numbers and invalid strings', () => {
		expect(() => toU8(Number.NaN)).toThrow(
			'Value must be a finite number or integer string',
		);
		expect(() => toU8(Number.NEGATIVE_INFINITY)).toThrow(
			'Value must be a finite number or integer string',
		);
		expect(() => toU8('1.5')).toThrow('Value must be a u8 integer');
		expect(() => toU8('1e3')).toThrow('Value must be a u8 integer');
	});

	it('rejects non-integer and out-of-range numbers', () => {
		expect(() => toU8(1.5)).toThrow('Value must be a u8 integer');
		expect(() => toU8(-1)).toThrow('Value must be a u8 integer');
		expect(() => toU8(256)).toThrow('Value must be a u8 integer');
		expect(() => toU8('256')).toThrow('Value must be a u8 integer');
	});
});

describe('toU16', () => {
	it('accepts valid u16 numbers and integer strings', () => {
		expect(toU16(0)).toBe(0);
		expect(toU16(65_535)).toBe(65_535);
		expect(toU16('1')).toBe(1);
		expect(toU16('0001')).toBe(1);
		expect(toU16('1e3')).toBe(1000);
	});

	it('rejects unsupported input types', () => {
		expect(() => toU16(undefined)).toThrow(
			'Value must be a finite number or integer string',
		);
		expect(() => toU16(true)).toThrow('Value must be a u16 integer');
	});

	it('rejects non-finite numbers and invalid strings', () => {
		expect(() => toU16(Number.NaN)).toThrow(
			'Value must be a finite number or integer string',
		);
		expect(() => toU16(Number.NEGATIVE_INFINITY)).toThrow(
			'Value must be a finite number or integer string',
		);
		expect(() => toU16('1.5')).toThrow('Value must be a u16 integer');
	});

	it('rejects non-integer and out-of-range numbers', () => {
		expect(() => toU16(1.5)).toThrow('Value must be a u16 integer');
		expect(() => toU16(-1)).toThrow('Value must be a u16 integer');
		expect(() => toU16(65_536)).toThrow('Value must be a u16 integer');
		expect(() => toU16('65536')).toThrow('Value must be a u16 integer');
	});
});
