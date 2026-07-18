import type { SuiClientTypes } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/sui/utils';
import type { SuigarClient } from '@suigar/sdk';
import {
	fromMoveFloat,
	isMoveFloat,
	parseGameDetails,
	parseGameEvent,
} from '@suigar/sdk/utils';
import { bigintToString } from '@/lib/suigar-app';
import type { EventLogRow } from '@/lib/suigar-types';

type ParsedEvent = {
	bcs?: string | Uint8Array;
	contents?: {
		value?: string | Uint8Array | number[];
	};
};

type BcsApi = SuigarClient['bcs'];

const textDecoder = new TextDecoder();

function bytesFromEvent(event: unknown) {
	if (typeof event !== 'object' || event === null) {
		return undefined;
	}

	const parsedEvent = event as ParsedEvent;
	const value = parsedEvent.bcs ?? parsedEvent.contents?.value;
	if (!value) {
		return undefined;
	}

	if (typeof value === 'string') {
		return fromBase64(value);
	}

	return value instanceof Uint8Array ? value : new Uint8Array(value);
}

function decodeByteArray(value: unknown) {
	if (!Array.isArray(value)) {
		return String(value);
	}

	try {
		return textDecoder.decode(new Uint8Array(value as number[]));
	} catch {
		return JSON.stringify(value);
	}
}

function formatVecMap(value: unknown) {
	if (
		typeof value !== 'object' ||
		value === null ||
		!('contents' in value) ||
		!Array.isArray(value.contents)
	) {
		return '';
	}

	return value.contents
		.map((entry: { key: string; value: unknown }) => {
			return `${entry.key}: ${decodeByteArray(entry.value)}`;
		})
		.join(' | ');
}

function formatParsedMap(value: Record<string, unknown>) {
	return Object.entries(value)
		.map(([key, parsedValue]) => `${key}: ${String(parsedValue)}`)
		.join(' | ');
}

function formatOraclePrice(value: unknown) {
	if (!isMoveFloat(value)) {
		return 'N/A';
	}

	const parsed = fromMoveFloat(value);
	if (!Number.isFinite(parsed)) {
		return 'N/A';
	}

	return parsed.toLocaleString(undefined, {
		maximumFractionDigits: 8,
	});
}

function createRow(
	digest: string,
	eventType: string,
	payload: Record<string, unknown>,
	details: string,
	options: Pick<EventLogRow, 'actor' | 'gameId'> = {},
): EventLogRow {
	return {
		id: `${digest}-${eventType}-${crypto.randomUUID()}`,
		timestamp: new Date().toISOString(),
		eventType,
		digest,
		details,
		raw: payload,
		...options,
	};
}

function createBetResultRow(
	bcsApi: BcsApi,
	digest: string,
	gameEvent: NonNullable<ReturnType<typeof parseGameEvent>>,
	bytes: Uint8Array,
) {
	const payload = bcsApi.BetResultEvent.parse(bytes);
	const gameDetails = parseGameDetails(gameEvent.gameId, payload.game_details);
	const details = [
		`game: ${gameEvent.gameId}`,
		`coin: ${payload.coin_type.name ?? 'unknown'}`,
		`stake: ${bigintToString(payload.stake_amount)}`,
		`outcome: ${bigintToString(payload.outcome_amount)}`,
		`unsafe oracle price: ${formatOraclePrice(payload.unsafe_oracle_usd_coin_price)}`,
		`adjusted oracle price: ${formatOraclePrice(payload.adjusted_oracle_usd_coin_price)}`,
		formatParsedMap(gameDetails),
		formatVecMap(payload.metadata),
	]
		.filter(Boolean)
		.join(' | ');

	console.log('Suigar BetResultEvent', payload);
	return createRow(digest, 'BetResultEvent', payload, details, {
		actor: String(payload.player),
	});
}

function createGameCreatedRow(
	bcsApi: BcsApi,
	digest: string,
	gameEvent: NonNullable<ReturnType<typeof parseGameEvent>>,
	bytes: Uint8Array,
) {
	const payload = bcsApi.PvPCoinflipGameCreatedEvent.parse(bytes);
	const side = payload.creator_is_tails ? 'tails' : 'heads';
	const details = [
		`game: ${gameEvent.gameId}`,
		`creator side: ${side}`,
		`stake: ${bigintToString(payload.stake_per_player)}`,
		`private: ${payload.is_private}`,
	].join(' | ');

	console.log('Suigar PvPCoinflipGameCreatedEvent', payload);
	return createRow(digest, gameEvent.eventName, payload, details, {
		gameId: String(payload.game_id),
		actor: String(payload.creator),
	});
}

function createGameResolvedRow(
	bcsApi: BcsApi,
	digest: string,
	gameEvent: NonNullable<ReturnType<typeof parseGameEvent>>,
	bytes: Uint8Array,
) {
	const payload = bcsApi.PvPCoinflipGameResolvedEvent.parse(bytes);
	const details = [
		`game: ${gameEvent.gameId}`,
		`winner: ${String(payload.winner)}`,
		`pot: ${bigintToString(payload.total_pot)}`,
		`payout: ${bigintToString(payload.payout_amount)}`,
	].join(' | ');

	console.log('Suigar PvPCoinflipGameResolvedEvent', payload);
	return createRow(digest, gameEvent.eventName, payload, details, {
		gameId: String(payload.game_id),
		actor: String(payload.winner),
	});
}

function createGameCancelledRow(
	bcsApi: BcsApi,
	digest: string,
	gameEvent: NonNullable<ReturnType<typeof parseGameEvent>>,
	bytes: Uint8Array,
) {
	const payload = bcsApi.PvPCoinflipGameCancelledEvent.parse(bytes);
	const details = [
		`game: ${gameEvent.gameId}`,
		`stake: ${bigintToString(payload.stake_per_player)}`,
		`private: ${payload.is_private}`,
	].join(' | ');

	console.log('Suigar PvPCoinflipGameCancelledEvent', payload);
	return createRow(digest, gameEvent.eventName, payload, details, {
		gameId: String(payload.game_id),
		actor: String(payload.creator),
	});
}

function createEventRow(
	bcsApi: BcsApi,
	digest: string,
	event: SuiClientTypes.Event,
): EventLogRow | null {
	const bytes = bytesFromEvent(event);
	if (!bytes) {
		return null;
	}

	const gameEvent = parseGameEvent(event);
	if (!gameEvent) {
		return null;
	}

	switch (gameEvent.eventName) {
		case 'BetResultEvent':
			return createBetResultRow(bcsApi, digest, gameEvent, bytes);
		case 'GameCreatedEvent':
			return createGameCreatedRow(bcsApi, digest, gameEvent, bytes);
		case 'GameResolvedEvent':
			return createGameResolvedRow(bcsApi, digest, gameEvent, bytes);
		case 'GameCancelledEvent':
			return createGameCancelledRow(bcsApi, digest, gameEvent, bytes);
		default:
			return null;
	}
}

export function parseSuigarEvents(
	client: { suigar: SuigarClient },
	digest: string,
	events: SuiClientTypes.Event[] | undefined,
) {
	const rows = (events ?? [])
		.map((event) => createEventRow(client.suigar.bcs, digest, event))
		.filter((row): row is EventLogRow => row !== null);

	return rows;
}
