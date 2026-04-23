import type { EventLogRow } from '@/lib/suigar-app';
import { fromBase64 } from '@mysten/sui/utils';
import { parseFloat as parseMoveFloat } from '@suigar/sdk/utils';
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

const textDecoder = new TextDecoder();

function decodeBytes(value: unknown) {
	if (!Array.isArray(value)) {
		return String(value);
	}

	try {
		return textDecoder.decode(new Uint8Array(value as number[]));
	} catch {
		return JSON.stringify(value);
	}
}

function decodeVecMap(value: unknown) {
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
			return `${entry.key}: ${decodeBytes(entry.value)}`;
		})
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

function getBcs(event: unknown) {
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

function getEventTypeName(event: unknown) {
	const eventType = getEventType(event);
	if (typeof eventType !== 'string') {
		return '';
	}

	return eventType.split('<')[0]?.split('::').at(-1) ?? '';
}

function getEventType(event: unknown) {
	if (typeof event !== 'object' || event === null) {
		return undefined;
	}

	const parsedEvent = event as ParsedEvent;
	return parsedEvent.eventType ?? parsedEvent.type;
}

function getStandardGameName(event: unknown) {
	const eventType = getEventType(event);
	if (typeof eventType !== 'string') {
		return 'unknown';
	}

	const gameType = eventType.match(/<([^>]+)>/)?.[1];
	const gameModule = gameType?.split('::').at(-2);

	return gameModule?.replaceAll('_', '-') ?? 'unknown';
}

export function parseSuigarEvents(
	client: SuigarClientLike,
	digest: string,
	events: unknown[] | undefined,
) {
	const rows: EventLogRow[] = [];
	const bcsApi = client.suigar.bcs as {
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

	for (const event of events ?? []) {
		const bcs = getBcs(event);
		if (!bcs) {
			continue;
		}

		const eventTypeName = getEventTypeName(event);

		if (eventTypeName === 'BetResultEvent') {
			const payload = bcsApi.BetResultEvent.parse(bcs);
			const gameName = getStandardGameName(event);
			const details = [
				`game: ${gameName}`,
				`coin: ${(payload.coin_type as { name?: string })?.name ?? 'unknown'}`,
				`stake: ${bigintToString(payload.stake_amount)}`,
				`outcome: ${bigintToString(payload.outcome_amount)}`,
				`unsafe oracle price: ${formatOraclePrice(payload.unsafe_oracle_usd_coin_price)}`,
				`adjusted oracle price: ${formatOraclePrice(payload.adjusted_oracle_usd_coin_price)}`,
				decodeVecMap(payload.game_details),
				decodeVecMap(payload.metadata),
			]
				.filter(Boolean)
				.join(' | ');

			console.log('Suigar BetResultEvent', payload);
			rows.push(
				createRow(digest, 'BetResultEvent', payload, details, {
					actor: String(payload.player),
				}),
			);
			continue;
		}

		if (eventTypeName === 'GameCreatedEvent') {
			const payload = bcsApi.PvPCoinflipGameCreated.parse(bcs);
			console.log('Suigar PvPCoinflipGameCreated', payload);
			rows.push(
				createRow(
					digest,
					'PvPCoinflipGameCreated',
					payload,
					`creator side: ${payload.creator_is_tails ? 'tails' : 'heads'} | stake: ${bigintToString(payload.stake_per_player)} | private: ${payload.is_private}`,
					{
						gameId: String(payload.game_id),
						actor: String(payload.creator),
					},
				),
			);
			continue;
		}

		if (eventTypeName === 'GameResolvedEvent') {
			const payload = bcsApi.PvPCoinflipGameResolved.parse(bcs);
			console.log('Suigar PvPCoinflipGameResolved', payload);
			rows.push(
				createRow(
					digest,
					'PvPCoinflipGameResolved',
					payload,
					`winner: ${String(payload.winner)} | pot: ${bigintToString(payload.total_pot)} | payout: ${bigintToString(payload.payout_amount)}`,
					{
						gameId: String(payload.game_id),
						actor: String(payload.winner),
					},
				),
			);
			continue;
		}

		if (eventTypeName === 'GameCancelledEvent') {
			const payload = bcsApi.PvPCoinflipGameCancelled.parse(bcs);
			console.log('Suigar PvPCoinflipGameCancelled', payload);
			rows.push(
				createRow(
					digest,
					'PvPCoinflipGameCancelled',
					payload,
					`stake: ${bigintToString(payload.stake_per_player)} | private: ${payload.is_private}`,
					{
						gameId: String(payload.game_id),
						actor: String(payload.creator),
					},
				),
			);
		}
	}

	return rows;
}
