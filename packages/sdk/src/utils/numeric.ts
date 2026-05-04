// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

/**
 * Ensures a value is a finite JavaScript number.
 *
 * This is only used for helpers that accept raw `number` input before applying
 * additional integer or range validation.
 */
function assertFiniteNumber(
	value: unknown,
	errorMessage: string,
): asserts value is number {
	if (typeof value !== 'number' || !Number.isFinite(value)) {
		throw new TypeError(`${errorMessage}: ${String(value)}`);
	}
}

/**
 * Normalizes a value into a non-negative `bigint`.
 *
 * Accepted inputs:
 * - `bigint`
 * - finite `number`
 * - base-10 integer `string`
 * - `boolean`
 *
 * Number inputs are truncated toward zero before conversion, so `5.9` becomes
 * `5n`. String and boolean inputs are parsed through the native
 * `BigInt(...)` constructor, so `true` becomes `1n`, `false` becomes `0n`,
 * and only integer strings are accepted.
 *
 * @param value Value to normalize.
 * @returns A non-negative `bigint`.
 * @throws When `value` is not a bigint, finite number, integer string, or
 * boolean.
 * @throws When the normalized value is negative.
 */
export function toBigInt(value: unknown): bigint {
	let result: bigint;

	try {
		if (
			typeof value === 'bigint' ||
			typeof value === 'string' ||
			typeof value === 'boolean'
		) {
			result = BigInt(value);
		} else {
			assertFiniteNumber(
				value,
				'Value must be a bigint, number, integer string, or boolean',
			);
			result = BigInt(Math.trunc(value));
		}
	} catch {
		throw new TypeError(
			`Value must be a bigint, number, integer string, or boolean: ${value}`,
		);
	}

	if (result < 0n) {
		throw new RangeError(`Value must be non-negative: ${value}`);
	}

	return result;
}

/**
 * Validates and normalizes a bounded unsigned integer.
 *
 * Accepted inputs:
 * - finite `number`
 * - base-10 integer `string`
 *
 * This internal helper powers the public `toU8()` and `toU16()` helpers. It
 * accepts stringified integers such as `'1'` for parsed values, but rejects
 * booleans, empty strings, fractional values, and out-of-range numbers.
 *
 * @param value Value to validate.
 * @param max Inclusive upper bound.
 * @param typeName Move integer label used in error messages.
 * @returns The validated integer as a JavaScript `number`.
 * @throws When `value` is not a finite number or integer string.
 * @throws When `value` is not an integer between `0` and `max`.
 */
function toBoundedInt(value: unknown, max: number, typeName: string): number {
	const num =
		typeof value === 'string' && value.trim() === '' ? NaN : Number(value);

	assertFiniteNumber(num, 'Value must be a finite number or integer string');
	if (
		typeof value === 'boolean' ||
		value == null ||
		!Number.isInteger(num) ||
		num < 0 ||
		num > max
	) {
		throw new Error(`Value must be a ${typeName} integer (0-${max}): ${value}`);
	}

	return num;
}

/**
 * Validates that a value can be safely used as a Move `u8` in the `0..255`
 * range.
 *
 * Accepted inputs:
 * - finite `number`
 * - base-10 integer `string`
 *
 * String inputs are accepted for parsed values such as `'1'`, but only when
 * they are plain non-negative integer strings. This helper does not accept
 * booleans and does not truncate fractional values.
 *
 * @param value Value to validate.
 * @returns The validated `u8` value as a JavaScript `number`.
 * @throws When `value` is not a finite number or integer string.
 * @throws When `value` is not an integer between `0` and `255`.
 */
export function toU8(value: unknown): number {
	return toBoundedInt(value, 255, 'u8');
}

/**
 * Validates that a value can be safely used as a Move `u16` in the
 * `0..65535` range.
 *
 * Accepted inputs:
 * - finite `number`
 * - base-10 integer `string`
 *
 * String inputs are accepted for parsed values such as `'1'`, but only when
 * they are plain non-negative integer strings. This helper does not accept
 * booleans and does not truncate fractional values.
 *
 * @param value Value to validate.
 * @returns The validated `u16` value as a JavaScript `number`.
 * @throws When `value` is not a finite number or integer string.
 * @throws When `value` is not an integer between `0` and `65535`.
 */
export function toU16(value: unknown): number {
	return toBoundedInt(value, 65535, 'u16');
}
