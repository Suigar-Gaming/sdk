// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';

const textEncoder = new TextEncoder();

export function writeU64(value: bigint): number[] {
	const bytes = new Array<number>(8).fill(0);
	for (let index = 0; index < 8; index += 1) {
		bytes[index] = Number((value >> BigInt(8 * index)) & 0xffn);
	}
	return bytes;
}

export function encodeFloat(value: number): number[] {
	if (value === 0) {
		return [0, ...writeU64(0n), ...writeU64(0n)];
	}

	const isNegative = value < 0;
	const magnitude = Math.abs(value);
	const exponent = Math.floor(Math.log2(magnitude));
	const mantissa = BigInt(Math.round(magnitude * Math.pow(2, 52 - exponent)));

	return [
		isNegative ? 1 : 0,
		...writeU64(BigInt(exponent)),
		...writeU64(mantissa),
	];
}

export function encodeString(value: string): number[] {
	return Array.from(bcs.string().serialize(value).toBytes());
}

export function encodeUtf8(value: string): number[] {
	return Array.from(textEncoder.encode(value));
}
