// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import type { SuiClientTypes } from '@mysten/sui/client';
import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';
import { Float } from '../contracts/core/float';
import {
	BetResultGameDetails,
	GAME_DETAILS_SCHEMA,
	GAMES,
	MoveFloat,
	ParsedGameDetails,
	ParsedGameDetailValue,
	SuigarGameEvent,
	type Game,
	type GameDetailValueType,
} from '../types';
import { fromMoveFloat } from './numeric';

const textDecoder = new TextDecoder();

const GAME_DETAIL_BCS = {
	u8: bcs.U8,
	u64: bcs.U64,
	bool: bcs.Bool,
	float: Float,
	string: bcs.String,
} as const;

/**
 * Extracts and normalizes the first generic coin type from a Move object type.
 *
 * PvP Coinflip game object types encode the wager coin as their first type parameter,
 * for example `Game<0x2::sui::SUI>`. This helper converts that generic type
 * argument into the SDK's canonical struct tag string.
 *
 * @param type Fully qualified Move object type with the coin type as its first generic argument.
 * @returns Normalized coin type struct tag.
 */
export function parseCoinType(type: string): string {
	const coinType = parseStructTag(type).typeParams[0];
	if (!coinType) {
		throw new TypeError(`Unable to parse coin type from ${type}`);
	}

	return normalizeStructTag(coinType);
}

/**
 * Resolves a Suigar event into its SDK game id and public event helper name.
 *
 * Standard bet result events are shared across games and encode the game family
 * in their first generic type parameter. PvP coinflip events use dedicated Move
 * event structs and are normalized to the public SDK helper names exposed under
 * `client.suigar.bcs`.
 *
 * @param event Sui event returned by the core client.
 * @returns Parsed SDK game id and event name.
 */
export function parseGameEvent(
	event: SuiClientTypes.Event,
): SuigarGameEvent | null {
	const eventType = parseStructTag(event.eventType);
	const module = eventType.module.replaceAll('_', '-');
	const gameId = GAMES.includes(module as Game)
		? module
		: eventType.typeParams[0];

	if (!gameId || typeof gameId !== 'string') {
		return null;
	}

	return {
		gameId,
		eventName: eventType.name,
	} as SuigarGameEvent;
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
 * original on-chain keys in the returned object. Unknown keys fall back to
 * string decoding so newer detail fields remain readable by default.
 *
 * @param gameDetails Raw `game_details` map from a decoded bet result event.
 * @returns A plain object with the same keys and decoded string, number, or boolean values.
 */
export function parseGameDetails(
	gameDetails: BetResultGameDetails,
): ParsedGameDetails {
	return gameDetails.contents.reduce<ParsedGameDetails>((details, entry) => {
		const valueType =
			GAME_DETAILS_SCHEMA[entry.key as keyof typeof GAME_DETAILS_SCHEMA] ??
			'string';
		details[entry.key] = parseGameDetail(valueType, entry.value);
		return details;
	}, {});
}
