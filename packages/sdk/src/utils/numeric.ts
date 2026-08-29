// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { MoveFloat } from '../types/index.js';

/**
 * Checks whether a value is a generated Move `i64` wrapper.
 *
 * Generated bindings represent signed 64-bit integers as an object containing a raw
 * two's-complement `bits` string.
 *
 * @param value Value to inspect.
 * @returns Whether `value` has the generated Move `i64` shape.
 */
export function isMoveI64(value: unknown): value is MoveFloat['exp'] {
	return (
		typeof value === 'object' && value !== null && 'bits' in value && typeof value.bits === 'string'
	);
}

/**
 * Checks whether a value is a generated Move `Float` struct.
 *
 * @param value Value to inspect.
 * @returns Whether `value` has the generated Move float shape.
 */
export function isMoveFloat(value: unknown): value is MoveFloat {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	return (
		'mant' in value &&
		'exp' in value &&
		'is_negative' in value &&
		typeof value.mant === 'string' &&
		isMoveI64(value.exp) &&
		typeof value.is_negative === 'boolean'
	);
}

/**
 * Converts a generated Move `i64` wrapper into a JavaScript number.
 *
 * The generated bindings expose signed 64-bit integers through a `{ bits }` field that stores the
 * raw two's-complement bit pattern. This helper reinterprets those bits as a signed `i64` and
 * returns a plain JS number. Invalid or missing input falls back to `0`.
 *
 * @param i64 Generated Move `i64` value, typically used for float exponents.
 * @returns The signed 64-bit value as a JavaScript number.
 */
export function fromMoveI64(i64: MoveFloat['exp']): number {
	try {
		return Number(BigInt.asIntN(64, BigInt(i64.bits ?? 0)));
	} catch {
		return 0;
	}
}

/**
 * Converts a generated Move `Float` struct into a JavaScript number.
 *
 * Suigar float values are represented as a sign flag, an unsigned mantissa, and a Move `i64`
 * exponent. This helper rebuilds the numeric value using the same normalization expected by the
 * on-chain format and applies the sign at the end. Missing mantissas are treated as `0`, and a zero
 * mantissa returns `0`.
 *
 * @param float Generated Move float value with `mant`, `exp`, and `is_negative`.
 * @returns The decoded floating-point value as a JavaScript number.
 */
export function fromMoveFloat(float: MoveFloat): number {
	const mantissa = BigInt(float.mant ?? 0);
	if (mantissa === 0n) {
		return 0;
	}
	const exponent = fromMoveI64(float.exp) - 52;
	const magnitude = Number(mantissa) * 2 ** exponent;
	return float.is_negative ? -magnitude : magnitude;
}

/**
 * Ensures a value is a finite JavaScript number.
 *
 * This is only used for helpers that accept raw `number` input before applying additional integer
 * or range validation.
 */
function assertFiniteNumber(value: unknown, errorMessage: string): asserts value is number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${errorMessage}: ${String(value)}`);
	}
}

/**
 * Normalizes a value into a non-negative `bigint`.
 *
 * Accepted inputs: - `bigint` - finite `number` - base-10 integer `string` - `boolean`
 *
 * Number inputs are truncated toward zero before conversion, so `5.9` becomes `5n`. String and
 * boolean inputs are parsed through the native `BigInt(...)` constructor, so `true` becomes `1n`,
 * `false` becomes `0n`, and only integer strings are accepted.
 *
 * @param value Value to normalize.
 * @returns A non-negative `bigint`.
 * @throws When `value` is not a bigint, finite number, integer string, or boolean.
 * @throws When the normalized value is negative.
 */
export function toBigInt(value: unknown): bigint {
	let result: bigint;

	try {
		if (typeof value === 'bigint' || typeof value === 'string' || typeof value === 'boolean') {
			result = BigInt(value);
		} else {
			assertFiniteNumber(value, 'Value must be a bigint, number, integer string, or boolean');
			result = BigInt(Math.trunc(value));
		}
	} catch {
		throw new TypeError(
			`Value must be a bigint, number, integer string, or boolean: ${String(value)}`,
		);
	}

	if (result < 0n) {
		throw new RangeError(`Value must be non-negative: ${String(value)}`);
	}

	return result;
}

/**
 * Validates and normalizes a bounded unsigned integer.
 *
 * Accepted inputs: - finite `number` - base-10 integer `string`
 *
 * This internal helper powers the public `toU8()` and `toU16()` helpers. It accepts stringified
 * integers such as `'1'` for parsed values, but rejects booleans, empty strings, fractional values,
 * and out-of-range numbers.
 *
 * @param options Value, inclusive upper bound, and Move integer label used in error messages.
 * @returns The validated integer as a JavaScript `number`.
 * @throws When `value` is not a finite number or integer string.
 * @throws When `value` is not an integer between `0` and `max`.
 */
function toBoundedInt({
	value,
	max,
	typeName,
}: {
	value: unknown;
	max: number;
	typeName: string;
}): number {
	const num = typeof value === 'string' && value.trim() === '' ? NaN : Number(value);

	assertFiniteNumber(num, 'Value must be a finite number or integer string');
	if (
		typeof value === 'boolean' ||
		value == null ||
		!Number.isInteger(num) ||
		num < 0 ||
		num > max
	) {
		throw new RangeError(`Value must be a ${typeName} integer (0-${max}): ${String(value)}`);
	}

	return num;
}

/**
 * Validates that a value can be safely used as a Move `u8` in the `0..255` range.
 *
 * Accepted inputs: - finite `number` - base-10 integer `string`
 *
 * String inputs are accepted for parsed values such as `'1'`, but only when they are plain
 * non-negative integer strings. This helper does not accept booleans and does not truncate
 * fractional values.
 *
 * @param value Value to validate.
 * @returns The validated `u8` value as a JavaScript `number`.
 * @throws When `value` is not a finite number or integer string.
 * @throws When `value` is not an integer between `0` and `255`.
 */
export function toU8(value: unknown): number {
	return toBoundedInt({ value, max: 255, typeName: 'u8' });
}

/**
 * Validates that a value can be safely used as a Move `u16` in the `0..65535` range.
 *
 * Accepted inputs: - finite `number` - base-10 integer `string`
 *
 * String inputs are accepted for parsed values such as `'1'`, but only when they are plain
 * non-negative integer strings. This helper does not accept booleans and does not truncate
 * fractional values.
 *
 * @param value Value to validate.
 * @returns The validated `u16` value as a JavaScript `number`.
 * @throws When `value` is not a finite number or integer string.
 * @throws When `value` is not an integer between `0` and `65535`.
 */
export function toU16(value: unknown): number {
	return toBoundedInt({ value, max: 65535, typeName: 'u16' });
}
