import type { EventLogRow } from '@/lib/suigar-app';
import { fromBase64 } from '@mysten/sui/utils';
import {
	parseFloat as parseMoveFloat,
	parseGameDetails,
} from '@suigar/sdk/utils';
import { bigintToString } from '@/lib/suigar-app';

type ParsedEvent = {
	bcs?: string | Uint8Array;
	contents?: {
		value?: string | Uint8Array | number[];
	};
	eventType?: string;
	type?: string;
};

type SuigarClientLike = {
	suigar: {
		bcs: unknown;
	};
};

type BcsApi = {
	BetResultEvent: { parse: (bytes: Uint8Array) => Record<string, unknown> };
	PvPCoinflipGameCreated: {
		parse: (bytes: Uint8Array) => Record<string, unknown>;
	};
	PvPCoinflipGameResolved: {
		parse: (bytes: Uint8Array) => Record<string, unknown>;
	};
	PvPCoinflipGameCancelled: {
		parse: (bytes: Uint8Array) => Record<string, unknown>;
	};
};

const textDecoder = new TextDecoder();

function asBcsApi(client: SuigarClientLike) {
	return client.suigar.bcs as BcsApi;
}

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

function eventType(event: unknown) {
	if (typeof event !== 'object' || event === null) {
		return '';
	}

	const parsedEvent = event as ParsedEvent;
	return parsedEvent.eventType ?? parsedEvent.type ?? '';
}

function eventName(event: unknown) {
	return eventType(event).split('<')[0]?.split('::').at(-1) ?? '';
}

function standardGameName(event: unknown) {
	const gameType = eventType(event).match(/<([^>]+)>/)?.[1];
	const gameModule = gameType?.split('::').at(-2);

	return gameModule?.replaceAll('_', '-') ?? 'unknown';
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
	if (typeof value !== 'object' || value === null) {
		return 'n/a';
	}

	const parsed = parseMoveFloat(value as Parameters<typeof parseMoveFloat>[0]);
	if (!Number.isFinite(parsed)) {
		return 'n/a';
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
	event: unknown,
	bytes: Uint8Array,
) {
	const payload = bcsApi.BetResultEvent.parse(bytes);
	const gameDetails = parseGameDetails(
		payload.game_details as Parameters<typeof parseGameDetails>[0],
	);
	const details = [
		`game: ${standardGameName(event)}`,
		`coin: ${(payload.coin_type as { name?: string })?.name ?? 'unknown'}`,
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
	bytes: Uint8Array,
) {
	const payload = bcsApi.PvPCoinflipGameCreated.parse(bytes);
	const side = payload.creator_is_tails ? 'tails' : 'heads';
	const details = [
		`creator side: ${side}`,
		`stake: ${bigintToString(payload.stake_per_player)}`,
		`private: ${payload.is_private}`,
	].join(' | ');

	console.log('Suigar PvPCoinflipGameCreated', payload);
	return createRow(digest, 'PvPCoinflipGameCreated', payload, details, {
		gameId: String(payload.game_id),
		actor: String(payload.creator),
	});
}

function createGameResolvedRow(
	bcsApi: BcsApi,
	digest: string,
	bytes: Uint8Array,
) {
	const payload = bcsApi.PvPCoinflipGameResolved.parse(bytes);
	const details = [
		`winner: ${String(payload.winner)}`,
		`pot: ${bigintToString(payload.total_pot)}`,
		`payout: ${bigintToString(payload.payout_amount)}`,
	].join(' | ');

	console.log('Suigar PvPCoinflipGameResolved', payload);
	return createRow(digest, 'PvPCoinflipGameResolved', payload, details, {
		gameId: String(payload.game_id),
		actor: String(payload.winner),
	});
}

function createGameCancelledRow(
	bcsApi: BcsApi,
	digest: string,
	bytes: Uint8Array,
) {
	const payload = bcsApi.PvPCoinflipGameCancelled.parse(bytes);
	const details = [
		`stake: ${bigintToString(payload.stake_per_player)}`,
		`private: ${payload.is_private}`,
	].join(' | ');

	console.log('Suigar PvPCoinflipGameCancelled', payload);
	return createRow(digest, 'PvPCoinflipGameCancelled', payload, details, {
		gameId: String(payload.game_id),
		actor: String(payload.creator),
	});
}

function createEventRow(
	bcsApi: BcsApi,
	digest: string,
	event: unknown,
): EventLogRow | null {
	const bytes = bytesFromEvent(event);
	if (!bytes) {
		return null;
	}

	switch (eventName(event)) {
		case 'BetResultEvent':
			return createBetResultRow(bcsApi, digest, event, bytes);
		case 'GameCreatedEvent':
			return createGameCreatedRow(bcsApi, digest, bytes);
		case 'GameResolvedEvent':
			return createGameResolvedRow(bcsApi, digest, bytes);
		case 'GameCancelledEvent':
			return createGameCancelledRow(bcsApi, digest, bytes);
		default:
			return null;
	}
}

export function parseSuigarEvents(
	client: SuigarClientLike,
	digest: string,
	events: unknown[] | undefined,
) {
	const bcsApi = asBcsApi(client);
	const rows = (events ?? [])
		.map((event) => createEventRow(bcsApi, digest, event))
		.filter((row): row is EventLogRow => row !== null);

	return rows;
}
