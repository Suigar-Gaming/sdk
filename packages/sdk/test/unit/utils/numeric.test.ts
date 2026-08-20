// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { toBigInt, toU8, toU16 } from '../../../src/utils/index.js';

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
		expect(() => toU8(undefined)).toThrow('Value must be a finite number or integer string');
		expect(() => toU8(true)).toThrow('Value must be a u8 integer');
	});

	it('rejects non-finite numbers and invalid strings', () => {
		expect(() => toU8(Number.NaN)).toThrow('Value must be a finite number or integer string');
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
		expect(() => toU16(undefined)).toThrow('Value must be a finite number or integer string');
		expect(() => toU16(true)).toThrow('Value must be a u16 integer');
	});

	it('rejects non-finite numbers and invalid strings', () => {
		expect(() => toU16(Number.NaN)).toThrow('Value must be a finite number or integer string');
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
