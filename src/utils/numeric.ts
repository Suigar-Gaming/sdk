// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export function toBigInt(value: bigint | number): bigint {
	if (typeof value === 'bigint') {
		if (value < 0n) {
			throw new Error(`Value must be non-negative: ${value}`);
		}
		return value;
	}

	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`Value must be a finite non-negative number: ${value}`);
	}

	return BigInt(Math.trunc(value));
}

export function toU8(value: number): number {
	if (!Number.isInteger(value) || value < 0 || value > 255) {
		throw new Error(`Value must be an integer between 0 and 255: ${value}`);
	}

	return value;
}
