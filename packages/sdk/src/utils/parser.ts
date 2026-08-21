// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import type { SuiClientTypes } from '@mysten/sui/client';
import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';
import { GAME_DETAIL_BCS, GAME_DETAILS_SCHEMAS } from '../types/game-details.type.js';
import { GAME_EVENTS, GAMES } from '../types/game.type.js';
import type {
	BetResultGameDetails,
	Game,
	GameDetail,
	GameDetails,
	GameDetailSchemaValueType,
	GameDetailVectorValueType,
	GameDetailValueType,
	GameEvent,
	MoveFloat,
	SuigarGameEvent,
	WithGame,
} from '../types/index.js';
import { fromMoveFloat } from './numeric.js';

const textDecoder = new TextDecoder();

/**
 * Extracts and normalizes the first generic coin type from a Move object type.
 *
 * PvP Coinflip game object types encode the wager coin as their first type parameter, for example `Game<0x2::sui::SUI>`. This helper converts that generic type argument into the SDK's canonical struct tag string.
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
 * Standard `BetResultEvent` payloads encode the game family through the core client event module or generic type parameter, while PvP coinflip events
 * resolve to the `pvp-coinflip` game id from their `pvp_coinflip` module.
 *
 * @param event Sui event returned by the core client.
 * @returns Parsed SDK game id and raw Move event name, or `null` when the event name is unsupported or the game id cannot be resolved.
 */
export function parseGameEvent(event: SuiClientTypes.Event): SuigarGameEvent | null {
	const { name: eventName, typeParams } = parseStructTag(event.eventType);
	const module = event.module.replaceAll('_', '-');
	const gameId = GAMES.includes(module as Game) ? module : typeParams[0];

	if (
		!GAME_EVENTS.includes(eventName as GameEvent) ||
		typeof gameId !== 'string' ||
		(gameId !== 'pvp-coinflip' && eventName !== 'BetResultEvent')
	) {
		return null;
	}

	return {
		gameId,
		eventName,
	} as SuigarGameEvent;
}

function parseStringGameDetail(value: Array<number>): string {
	const bytes = Uint8Array.from(value);

	try {
		return bcs.String.parse(bytes);
	} catch {
		return textDecoder.decode(bytes);
	}
}

function normalizeBcsGameDetailValue<TValueType extends GameDetailValueType>(
	valueType: TValueType,
	parsed: unknown,
): GameDetail<TValueType> {
	switch (valueType) {
		case 'float':
			return fromMoveFloat(parsed as MoveFloat) as GameDetail<TValueType>;
		case 'u64':
		case 'u128':
			return Number(parsed) as GameDetail<TValueType>;
		default:
			return parsed as GameDetail<TValueType>;
	}
}

function parseVectorValueType(valueType: GameDetailSchemaValueType): GameDetailValueType | null {
	if (!valueType.startsWith('vector<') || !valueType.endsWith('>')) {
		return null;
	}

	const elementType = valueType.slice(7, -1);
	return elementType in GAME_DETAIL_BCS ? (elementType as GameDetailValueType) : null;
}

function parseVectorGameDetail<TValueType extends GameDetailVectorValueType>({
	valueType,
	elementType,
	value,
}: {
	valueType: TValueType;
	elementType: GameDetailValueType;
	value: Array<number>;
}): GameDetail<TValueType> {
	const bytes = Uint8Array.from(value);
	const vectorBcs = bcs.vector(GAME_DETAIL_BCS[elementType]);
	const parsed = vectorBcs.parse(bytes);
	const serialized = vectorBcs.serialize(parsed).toBytes();

	if (
		serialized.length !== bytes.length ||
		serialized.some((byte, index) => byte !== bytes[index])
	) {
		throw new TypeError(`Invalid BCS ${valueType} game detail value.`);
	}

	return parsed.map((item) =>
		normalizeBcsGameDetailValue(elementType, item),
	) as GameDetail<TValueType>;
}

function parseGameDetail<TValueType extends GameDetailSchemaValueType>({
	valueType,
	value,
}: {
	valueType: TValueType;
	value: Array<number>;
}): GameDetail<TValueType> {
	if (valueType === 'string') {
		return parseStringGameDetail(value) as GameDetail<TValueType>;
	}

	const vectorElementType = parseVectorValueType(valueType);
	if (vectorElementType) {
		return parseVectorGameDetail({
			valueType: valueType as GameDetailVectorValueType,
			elementType: vectorElementType,
			value,
		}) as GameDetail<TValueType>;
	}

	const scalarValueType = valueType as GameDetailValueType;
	const parsed = GAME_DETAIL_BCS[scalarValueType].parse(Uint8Array.from(value));
	return normalizeBcsGameDetailValue(scalarValueType, parsed) as GameDetail<TValueType>;
}

/**
 * Decodes `BetResultEvent.game_details` into plain application values.
 *
 * Use this only with the `game_details` field from a decoded `BetResultEvent`.
 * Suigar stores those entries as `VecMap<string, vector<u8>>`, so raw BCS decoding leaves each value as bytes. This helper uses the provided `gameId`
 * to narrow the known detail schema, parses each byte array into the expected
 * runtime type, and preserves the original on-chain keys in the returned
 * object. Unknown keys fall back to string decoding so newer detail fields
 * remain readable by default.
 *
 * Call `parseGameEvent(event)` first when you need to derive the matching
 * `gameId` from the raw `SuiClientTypes.Event` before decoding
 * `decoded.game_details`.
 *
 * @param options Game and game details from a decoded `BetResultEvent`.
 * @returns A plain object with decoded values for the known keys of the selected game.
 */
export function parseGameDetails<TGame extends Game>({
	game,
	gameDetails,
}: WithGame<
	{
		gameDetails: BetResultGameDetails;
	},
	TGame
>): GameDetails<TGame> {
	const schema: Record<string, GameDetailSchemaValueType> = GAME_DETAILS_SCHEMAS[game];
	const details = gameDetails.contents.reduce<Record<string, unknown>>((parsedDetails, entry) => {
		const valueType = schema[entry.key] ?? 'string';
		parsedDetails[entry.key] = parseGameDetail({
			valueType,
			value: entry.value,
		});
		return parsedDetails;
	}, {});

	return details as GameDetails<TGame>;
}
