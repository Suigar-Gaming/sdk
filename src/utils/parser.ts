// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';

import { Float } from '../contracts/core/float';
import {
	BetResultGameDetails,
	GAME_DETAILS_SCHEMA,
	ParsedGameDetails,
	ParsedGameDetailValue,
	type GameDetailValueType,
} from '../types';

const bcsU8 = bcs.u8();
const bcsU64 = bcs.u64();
const bcsBool = bcs.bool();
const bcsString = bcs.string();
const textDecoder = new TextDecoder();

const GAME_DETAIL_BCS = {
	u8: bcsU8,
	u64: bcsU64,
	bool: bcsBool,
	float: Float,
	string: bcsString,
} as const;

export function fromMoveI64(
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

export function fromMoveFloat(
	float: ReturnType<(typeof Float)['parse']>,
): number {
	const mantissa = BigInt(float.mant);
	if (mantissa === 0n) {
		return 0;
	}
	const exponent = fromMoveI64(float.exp) - 52;
	const magnitude = Number(mantissa) * Math.pow(2, exponent);
	return float.is_negative ? -magnitude : magnitude;
}

function normalizeGameDetailValue(
	valueType: GameDetailValueType,
	parsed: unknown,
): ParsedGameDetailValue {
	if (valueType === 'float') {
		return fromMoveFloat(parsed as ReturnType<(typeof Float)['parse']>);
	}

	if (valueType === 'u64') {
		return Number(parsed);
	}

	return parsed as ParsedGameDetailValue;
}

function parseStringGameDetail(value: number[]): string {
	const bytes = Uint8Array.from(value);

	try {
		return bcsString.parse(bytes);
	} catch {
		return textDecoder.decode(bytes);
	}
}

function parseGameDetail(
	valueType: GameDetailValueType,
	value: number[],
): ParsedGameDetailValue {
	if (valueType === 'string') {
		return parseStringGameDetail(value);
	}

	const parsed = GAME_DETAIL_BCS[valueType].parse(Uint8Array.from(value));
	return normalizeGameDetailValue(valueType, parsed);
}

export function parseGameDetails(
	gameDetails: BetResultGameDetails,
): ParsedGameDetails {
	return gameDetails.contents.reduce<ParsedGameDetails>((details, entry) => {
		const valueType = GAME_DETAILS_SCHEMA[entry.key] ?? 'string';
		details[entry.key] = parseGameDetail(valueType, entry.value);
		return details;
	}, {});
}
