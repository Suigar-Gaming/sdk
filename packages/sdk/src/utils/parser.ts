// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import type { SuiClientTypes } from '@mysten/sui/client';
import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';
import {
	GAME_DETAIL_BCS,
	GAME_DETAILS_SCHEMAS,
	type BetResultGameDetails,
	type GameDetail,
	type GameDetails,
	type GameDetailValueType,
} from '../types/game-details.type.js';
import {
	GAME_EVENTS,
	GAMES,
	type Game,
	type GameEvent,
	type SuigarGameEvent,
} from '../types/game.type.js';
import type { MoveFloat } from '../types/move-float.type.js';
import { fromMoveFloat } from './numeric.js';

const textDecoder = new TextDecoder();

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
 * Resolves a supported Suigar event into its normalized SDK game id and event name.
 *
 * This helper recognizes all supported Suigar event names in `GAME_EVENTS`.
 * Standard `BetResultEvent` payloads encode the game family through the core
 * client event module or generic type parameter, while PvP coinflip events
 * resolve to the `pvp-coinflip` game id from their `pvp_coinflip` module.
 *
 * @param event Sui event returned by the core client.
 * @returns Parsed SDK game id and raw Move event name, or `null` when the event
 * name is unsupported or the game id cannot be resolved.
 */
export function parseGameEvent(
	event: SuiClientTypes.Event,
): SuigarGameEvent | null {
	const { name: eventName, typeParams } = parseStructTag(event.eventType);
	const module = event.module.replaceAll('_', '-');
	const gameId = GAMES.includes(module as Game) ? module : typeParams[0];

	if (
		!GAME_EVENTS.includes(eventName as GameEvent) ||
		typeof gameId !== 'string'
	) {
		return null;
	}

	return {
		gameId,
		eventName,
	} as SuigarGameEvent;
}

function parseStringGameDetail(value: number[]): string {
	const bytes = Uint8Array.from(value);

	try {
		return bcs.String.parse(bytes);
	} catch {
		return textDecoder.decode(bytes);
	}
}

function parseGameDetail<TValueType extends GameDetailValueType>(
	valueType: TValueType,
	value: number[],
): GameDetail<TValueType> {
	if (valueType === 'string') {
		return parseStringGameDetail(value) as GameDetail<TValueType>;
	}

	const parsed = GAME_DETAIL_BCS[valueType].parse(Uint8Array.from(value));

	switch (valueType) {
		case 'float':
			return fromMoveFloat(parsed as MoveFloat) as GameDetail<TValueType>;
		case 'u64':
			return Number(parsed) as GameDetail<TValueType>;
		default:
			return parsed as GameDetail<TValueType>;
	}
}

/**
 * Decodes `BetResultEvent.game_details` into plain application values.
 *
 * Use this only with the `game_details` field from a decoded `BetResultEvent`.
 * Suigar stores those entries as `VecMap<string, vector<u8>>`, so raw BCS
 * decoding leaves each value as bytes. This helper uses the provided `gameId`
 * to narrow the known detail schema, parses each byte array into the expected
 * runtime type, and preserves the original on-chain keys in the returned
 * object. Unknown keys fall back to string decoding so newer detail fields
 * remain readable by default.
 *
 * Call `parseGameEvent(event)` first when you need to derive the matching
 * `gameId` from the raw `SuiClientTypes.Event` before decoding
 * `decoded.game_details`.
 *
 * @param gameId Suigar game id used to narrow the known detail keys and value
 * types for this bet result payload.
 * @param gameDetails Raw `game_details` map from a decoded `BetResultEvent`.
 * @returns A plain object with decoded values for the known keys of the
 * selected game.
 */
export function parseGameDetails<TGame extends Game>(
	gameId: TGame,
	gameDetails: BetResultGameDetails,
): GameDetails<TGame> {
	const schema: Record<string, GameDetailValueType> =
		GAME_DETAILS_SCHEMAS[gameId];
	const details = gameDetails.contents.reduce<Record<string, unknown>>(
		(parsedDetails, entry) => {
			const valueType = schema[entry.key] ?? 'string';
			parsedDetails[entry.key] = parseGameDetail(valueType, entry.value);
			return parsedDetails;
		},
		{},
	);

	return details as GameDetails<TGame>;
}
