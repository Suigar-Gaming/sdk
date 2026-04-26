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
