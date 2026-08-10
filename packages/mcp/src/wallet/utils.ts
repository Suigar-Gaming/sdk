// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export function resolvePositiveInteger(
	value: number | string | undefined,
	name: string,
	defaultValue: number,
): number {
	if (value === undefined || value === '') return defaultValue;
	const parsed = typeof value === 'number' ? value : Number(value);
	if (!Number.isInteger(parsed) || parsed <= 0)
		throw new RangeError(`${name} must be a positive integer.`);
	return parsed;
}
