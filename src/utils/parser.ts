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

type MoveFloat = ReturnType<(typeof Float)['parse']>;

const textDecoder = new TextDecoder();

const GAME_DETAIL_BCS = {
	u8: bcs.U8,
	u64: bcs.U64,
	bool: bcs.Bool,
	float: Float,
	string: bcs.String,
} as const;

export function fromMoveI64(i64: MoveFloat['exp']): number {
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

export function fromMoveFloat(float: MoveFloat): number {
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
		return fromMoveFloat(parsed as MoveFloat);
	}

	if (valueType === 'u64') {
		return Number(parsed);
	}

	return parsed as ParsedGameDetailValue;
}

function parseStringGameDetail(value: number[]): string {
	const bytes = Uint8Array.from(value);

	try {
		return bcs.String.parse(bytes);
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

/**
 * Decodes `BetResultEvent.game_details` into plain application values.
 *
 * Suigar stores game detail entries as `VecMap<string, vector<u8>>`, so raw BCS
 * decoding leaves each value as bytes. This helper looks up the known schema for
 * each key, parses the bytes into the expected runtime type, and preserves the
 * original onchain keys in the returned object. Unknown keys fall back to
 * string decoding so newer detail fields remain readable by default.
 *
 * @param gameDetails Raw `game_details` map from a decoded bet result event.
 * @returns A plain object with the same keys and decoded string, number, or boolean values.
 */
export function parseGameDetails(
	gameDetails: BetResultGameDetails,
): ParsedGameDetails {
	return gameDetails.contents.reduce<ParsedGameDetails>((details, entry) => {
		const valueType = GAME_DETAILS_SCHEMA[entry.key] ?? 'string';
		details[entry.key] = parseGameDetail(valueType, entry.value);
		return details;
	}, {});
}
