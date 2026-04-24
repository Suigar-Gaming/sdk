// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export function toBigIntAmount(
	value: bigint | number,
	fieldName: string,
): bigint {
	if (typeof value === 'bigint') {
		if (value < 0n) {
			throw new Error(`${fieldName} must be non-negative`);
		}
		return value;
	}

	if (!Number.isFinite(value) || value < 0) {
		throw new Error(`${fieldName} must be a finite non-negative number`);
	}

	return BigInt(Math.trunc(value));
}

export function toU8Number(value: number, fieldName: string): number {
	if (!Number.isInteger(value) || value < 0 || value > 255) {
		throw new Error(`${fieldName} must be an integer between 0 and 255`);
	}

	return value;
}
