import type { EventLogRow } from '@/lib/suigar-app';
import { fromBase64 } from '@mysten/sui/utils';
import { bigintToString } from '@/lib/suigar-app';

type ParsedEvent = {
	bcs?: string | Uint8Array;
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
	if (!('bcs' in parsedEvent)) {
		return undefined;
	}

	return typeof parsedEvent.bcs === 'string'
		? fromBase64(parsedEvent.bcs)
		: parsedEvent.bcs;
}

function getEventTypeName(event: unknown) {
	if (typeof event !== 'object' || event === null) {
		return '';
	}

	const parsedEvent = event as ParsedEvent;
	if (typeof parsedEvent.type !== 'string') {
		return '';
	}

	return parsedEvent.type.split('::').at(-1)?.split('<')[0] ?? '';
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
			const details = [
				`coin: ${(payload.coin_type as { name?: string })?.name ?? 'unknown'}`,
				`stake: ${bigintToString(payload.stake_amount)}`,
				`outcome: ${bigintToString(payload.outcome_amount)}`,
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
