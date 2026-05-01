// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

function isFiniteNumber(
	value: unknown,
	message: string,
): asserts value is number {
	if (typeof value !== 'number') {
		throw new Error(`${message}: ${String(value)}`);
	}

	if (!Number.isFinite(value)) {
		throw new Error(`Value must be a finite number: ${value}`);
	}
}

/**
 * Normalizes a numeric input into a non-negative `bigint`.
 *
 * This helper accepts the two number shapes the SDK commonly sees from app
 * code: plain JavaScript numbers and already-normalized `bigint` values.
 * Number inputs are truncated toward zero before conversion, so UI-friendly
 * values like `5.9` become `5n`.
 *
 * @param value Value to coerce into a `bigint`.
 * @returns The normalized non-negative `bigint`.
 * @throws When `value` is not a finite number or bigint, or when it is negative.
 */
export function toBigInt(value: unknown): bigint {
	if (typeof value === 'bigint') {
		if (value < 0n) {
			throw new Error(`Value must be non-negative: ${value}`);
		}
		return value;
	}

	isFiniteNumber(value, 'Value must be a bigint or number');

	if (value < 0) {
		throw new Error(`Value must be a finite non-negative number: ${value}`);
	}

	return BigInt(Math.trunc(value));
}

/**
 * Validates that a value can be safely used as a Move `u8`.
 *
 * Use this for config ids and other small integer fields that must stay inside
 * the `0..255` range. Unlike `toBigInt`, this does not coerce fractional
 * values: the input must already be an integer.
 *
 * @param value Value to validate.
 * @returns The original number once it has been confirmed to be a valid `u8`.
 * @throws When `value` is not a finite integer between `0` and `255`.
 */
export function toU8(value: unknown): number {
	isFiniteNumber(value, 'Value must be a number');

	if (!Number.isInteger(value)) {
		throw new Error(`Value must be an integer: ${value}`);
	}

	if (value < 0 || value > 255) {
		throw new Error(`Value must be an integer between 0 and 255: ${value}`);
	}

	return value;
}
