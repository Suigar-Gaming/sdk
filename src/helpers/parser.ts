// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Float } from '../contracts/core/float';

export function parseI64(
	i64: ReturnType<(typeof Float)['parse']>['exp'],
): number {
	try {
		const value = BigInt(i64.bits ?? 0);
		const maxPositive = 1n << 63n;
		const twoPow64 = 1n << 64n;
		const signed = value >= maxPositive ? value - twoPow64 : value;
		return Number(signed);
	} catch {
		return 0;
	}
}

export function parseFloat(float: ReturnType<(typeof Float)['parse']>): number {
	const mantissa = BigInt(float.mant);
	if (mantissa === 0n) {
		return 0;
	}
	const exponent = parseI64(float.exp) - 52;
	const magnitude = Number(mantissa) * Math.pow(2, exponent);
	return float.is_negative ? -magnitude : magnitude;
}
