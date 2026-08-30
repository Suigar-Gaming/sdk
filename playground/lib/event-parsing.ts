import type { SuiClientTypes } from '@mysten/sui/client';
import { fromBase64 } from '@mysten/sui/utils';
import type { SuigarClient } from '@suigar/sdk';
import { fromMoveFloat, isMoveFloat, parseSuigarEvent } from '@suigar/sdk/utils';
import { bigintToString } from '@/lib/suigar-app';
import type { EventLogRow } from '@/lib/suigar-types';

type EventWithBcsPayload = {
	bcs?: string | Uint8Array;
	contents?: {
		value?: string | Uint8Array | Array<number>;
	};
};

const textDecoder = new TextDecoder();

function bytesFromEvent(event: unknown) {
	if (typeof event !== 'object' || event === null) {
		return undefined;
	}

	const eventWithBcsPayload = event as EventWithBcsPayload;
	const value = eventWithBcsPayload.bcs ?? eventWithBcsPayload.contents?.value;
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
		return textDecoder.decode(new Uint8Array(value as Array<number>));
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

function formatGameDetails(value: Record<string, unknown>) {
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

function createEventRow(digest: string, event: SuiClientTypes.Event): EventLogRow | null {
	const bytes = bytesFromEvent(event);
	if (!bytes) {
		return null;
	}

	const suigarEvent = parseSuigarEvent({ ...event, bcs: bytes });
	if (!suigarEvent) {
		return null;
	}

	const payload = suigarEvent.event.data as Record<string, unknown>;
	const gameDetails = 'gameDetails' in suigarEvent ? suigarEvent.gameDetails : undefined;
	const eventType = suigarEvent.event.type;
	const details = [
		`game: ${suigarEvent.game}`,
		...(eventType === 'BetResultEvent'
			? [
					`coin: ${String((payload.coin_type as { name?: string })?.name ?? 'unknown')}`,
					`stake: ${bigintToString(payload.stake_amount)}`,
					`outcome: ${bigintToString(payload.outcome_amount)}`,
					`unsafe oracle price: ${formatOraclePrice(payload.unsafe_oracle_usd_coin_price)}`,
					`adjusted oracle price: ${formatOraclePrice(payload.adjusted_oracle_usd_coin_price)}`,
					gameDetails ? formatGameDetails(gameDetails) : '',
					formatVecMap(payload.metadata),
				]
			: eventType === 'GameCreatedEvent'
				? [
						`creator side: ${payload.creator_is_tails ? 'tails' : 'heads'}`,
						`stake: ${bigintToString(payload.stake_per_player)}`,
						`private: ${String(payload.is_private)}`,
					]
				: eventType === 'GameResolvedEvent'
					? [
							`winner: ${String(payload.winner)}`,
							`pot: ${bigintToString(payload.total_pot)}`,
							`payout: ${bigintToString(payload.payout_amount)}`,
						]
					: [
							`stake: ${bigintToString(payload.stake_per_player)}`,
							`private: ${String(payload.is_private)}`,
						]),
	]
		.filter(Boolean)
		.join(' | ');

	console.log(`Suigar ${eventType}`, payload);
	return createRow(digest, eventType, payload, details, {
		actor: String(payload.player ?? payload.winner ?? payload.creator),
		...(typeof payload.game_id === 'string' ? { gameId: payload.game_id } : {}),
	});
}

export function parseSuigarEvents(
	client: { suigar: SuigarClient },
	digest: string,
	events: Array<SuiClientTypes.Event> | undefined,
) {
	const rows = (events ?? [])
		.map((event) => createEventRow(digest, event))
		.filter((row): row is EventLogRow => row !== null);

	return rows;
}
