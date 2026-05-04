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
		throw new Error(`${errorMessage}: ${String(value)}`);
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
		throw new Error(
			`Value must be a bigint, number, integer string, or boolean: ${value}`,
		);
	}

	if (result < 0n) {
		throw new Error(`Value must be non-negative: ${value}`);
	}

	return result;
}

/**
 * Validates that a value can be safely used as a Move `u8`.
 *
 * The input must already be a finite integer in the inclusive `0..255` range.
 * This helper does not coerce strings or truncate fractional numbers.
 *
 * @param value Value to validate.
 * @returns The original numeric value once validated.
 * @throws When `value` is not a finite number.
 * @throws When `value` is not an integer between `0` and `255`.
 */
export function toU8(value: unknown): number {
	assertFiniteNumber(value, 'Value must be a finite number');

	if (!Number.isInteger(value) || value < 0 || value > 255) {
		throw new Error(`Value must be an integer between 0 and 255: ${value}`);
	}

	return value;
}
