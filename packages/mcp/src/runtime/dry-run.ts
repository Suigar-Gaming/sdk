// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { GAMES, type Game } from '@suigar/sdk/games';
import { parseGameDetails, parseGameEvent } from '@suigar/sdk/utils';
import type { SuigarClientBundle } from './client.js';
import { formatAmount, MIST_DECIMALS } from './format.js';
import type {
	DryRunEventSummary,
	DryRunSummary,
	JsonValue,
	RawDryRunResult,
	TransactionSummaryFormattingContext,
} from './types.js';

const amountFieldNames = new Set([
	'stake_amount',
	'outcome_amount',
	'payout_amount',
	'amount',
]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === 'object';

const getDryRunTransaction = (dryRun: RawDryRunResult) => {
	if (!isRecord(dryRun)) {
		return undefined;
	}
	return dryRun.FailedTransaction ?? dryRun.Transaction;
};

export const toJsonValue = (value: unknown): JsonValue | undefined => {
	if (
		value == null ||
		typeof value === 'string' ||
		typeof value === 'boolean'
	) {
		return value ?? null;
	}
	if (typeof value === 'number') {
		return Number.isFinite(value) ? value : String(value);
	}
	if (typeof value === 'bigint') {
		return value.toString();
	}
	if (value instanceof Uint8Array) {
		return Array.from(value);
	}
	if (Array.isArray(value)) {
		const jsonValues: JsonValue[] = [];
		for (const item of value) {
			const jsonValue = toJsonValue(item);
			if (jsonValue !== undefined) {
				jsonValues.push(jsonValue);
			}
		}
		return jsonValues;
	}
	if (isRecord(value)) {
		const jsonRecord: Record<string, JsonValue> = {};
		for (const key in value) {
			if (Object.hasOwn(value, key)) {
				const jsonValue = toJsonValue(value[key]);
				if (jsonValue !== undefined) {
					jsonRecord[key] = jsonValue;
				}
			}
		}
		return jsonRecord;
	}
	return undefined;
};

const collectStrings = (value: unknown, path: string[]): string[] => {
	if (!isRecord(value)) {
		return [];
	}

	return path.flatMap((key) => {
		const next = value[key];
		if (typeof next === 'string' && next.trim()) {
			return [next.trim()];
		}
		if (Array.isArray(next)) {
			return next.filter((item): item is string => typeof item === 'string');
		}
		if (isRecord(next)) {
			return collectStrings(next, path);
		}
		return [];
	});
};

export const extractDryRunErrors = (dryRun: RawDryRunResult): string[] => {
	const source: unknown = getDryRunTransaction(dryRun) ?? dryRun;
	const effects = isRecord(source) ? source.effects : undefined;
	const status = isRecord(effects) ? effects.status : undefined;
	const errorSources = [source, effects, status].filter(isRecord);

	const errors = errorSources.flatMap((item) =>
		collectStrings(item, ['error', 'cleverError', 'message']),
	);
	return [...new Set(errors)];
};

const stringField = (record: Record<string, unknown>, key: string) => {
	const value = record[key];
	return typeof value === 'string' ||
		typeof value === 'number' ||
		typeof value === 'bigint'
		? String(value)
		: undefined;
};

const gasUsedSummary = (
	effects: unknown,
	decimals?: number,
): DryRunSummary['gasUsed'] => {
	const gasUsed = isRecord(effects) ? effects.gasUsed : undefined;
	if (!isRecord(gasUsed)) {
		return {
			computation: null,
			storage: null,
			rebate: null,
			nonRefundableStorageFee: null,
			net: null,
		};
	}

	const computation = stringField(gasUsed, 'computationCost');
	const storage = stringField(gasUsed, 'storageCost');
	const rebate = stringField(gasUsed, 'storageRebate');
	const nonRefundableStorageFee = stringField(
		gasUsed,
		'nonRefundableStorageFee',
	);
	const net =
		computation && storage && rebate
			? String(-(BigInt(computation) + BigInt(storage) - BigInt(rebate)))
			: undefined;

	return {
		computation: formatAmount(computation, decimals),
		storage: formatAmount(storage, decimals),
		rebate: formatAmount(rebate, decimals),
		nonRefundableStorageFee: formatAmount(nonRefundableStorageFee, decimals),
		net: formatAmount(net, decimals),
	};
};

const eventFields = (
	fields: Record<string, unknown>,
	decimals?: number,
): Record<string, JsonValue> => {
	const formattedFields: Record<string, JsonValue> = {};
	for (const key in fields) {
		if (!Object.hasOwn(fields, key)) {
			continue;
		}

		const value = fields[key];
		const jsonValue = toJsonValue(value);
		if (jsonValue === undefined) {
			continue;
		}

		formattedFields[key] = jsonValue;
		if (amountFieldNames.has(key)) {
			const displayValue = formatAmount(value, decimals);
			if (displayValue) {
				formattedFields[`${key}_display`] = displayValue.display;
			}
		}
	}
	return formattedFields;
};

const parseDryRunEvent = (
	event: Record<string, unknown>,
	eventType: string,
): ReturnType<typeof parseGameEvent> => {
	const module =
		typeof event.module === 'string'
			? event.module
			: eventType.includes('::core::')
				? 'core'
				: eventType.includes('::pvp_coinflip::')
					? 'pvp_coinflip'
					: '';

	if (!module) {
		return null;
	}

	try {
		const parsedEvent = parseGameEvent({
			...event,
			eventType,
			module,
		} as never);
		if (parsedEvent) {
			return parsedEvent;
		}
	} catch {
		// Fall back to string matching below for JSON-only simulated events.
	}

	const standardBetResult = /::BetResultEvent<[^>]+::([^:<>,]+)::Game>/u.exec(
		eventType,
	);
	const gameId = standardBetResult?.[1]?.replaceAll('_', '-');
	return gameId && GAMES.includes(gameId as Game)
		? {
				gameId: gameId as Game,
				eventName: 'BetResultEvent',
			}
		: null;
};

const summarizeDryRunEvent = (
	event: unknown,
	client: SuigarClientBundle['client'],
	decimals?: number,
): DryRunEventSummary | null => {
	if (!isRecord(event)) {
		return null;
	}

	const eventType =
		typeof event.eventType === 'string'
			? event.eventType
			: typeof event.type === 'string'
				? event.type
				: 'unknown';
	const baseSummary = {
		type: eventType,
	};
	let parsedEvent: ReturnType<typeof parseDryRunEvent> = null;

	try {
		parsedEvent = parseDryRunEvent(event, eventType);
		if (parsedEvent && event.bcs instanceof Uint8Array) {
			const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
			const details = parseGameDetails(
				parsedEvent.gameId,
				decoded.game_details,
			);
			return {
				...baseSummary,
				game: parsedEvent.gameId,
				eventName: parsedEvent.eventName,
				fields: eventFields(
					{
						...decoded,
						game_details: details,
						...details,
					},
					decimals,
				),
			};
		}
	} catch {
		// Fall back to API-provided JSON below.
	}

	const json = isRecord(event.json)
		? event.json
		: isRecord(event.parsedJson)
			? event.parsedJson
			: null;
	return json
		? {
				...baseSummary,
				...(parsedEvent
					? {
							game: parsedEvent.gameId,
							eventName: parsedEvent.eventName,
						}
					: {}),
				fields: eventFields(json, decimals),
			}
		: null;
};

export const summarizeDryRun = (
	dryRun: RawDryRunResult,
	client: SuigarClientBundle['client'],
	context: TransactionSummaryFormattingContext = {},
): DryRunSummary => {
	const transaction = getDryRunTransaction(dryRun);
	const transactionRecord: Record<string, unknown> = isRecord(transaction)
		? transaction
		: {};
	const effects = transactionRecord.effects;
	const status = isRecord(effects) ? effects.status : undefined;
	const success = isRecord(status) ? status.success === true : false;
	const statusError = isRecord(status) ? status.error : undefined;
	const error =
		typeof statusError === 'string'
			? statusError
			: isRecord(statusError) && typeof statusError.message === 'string'
				? statusError.message
				: null;
	const balanceChanges = Array.isArray(transactionRecord.balanceChanges)
		? transactionRecord.balanceChanges.reduce<DryRunSummary['balanceChanges']>(
				(changes, change) => {
					if (isRecord(change)) {
						const rawAmount = toJsonValue(change.amount);
						changes.push({
							address: typeof change.address === 'string' ? change.address : '',
							coinType:
								typeof change.coinType === 'string' ? change.coinType : '',
							amount:
								formatAmount(change.amount, context.coinDecimals) ??
								({
									raw:
										typeof rawAmount === 'string' ||
										typeof rawAmount === 'number' ||
										typeof rawAmount === 'boolean'
											? String(rawAmount)
											: '',
									display: '',
								} as const),
						});
					}
					return changes;
				},
				[],
			)
		: [];
	const events = Array.isArray(transactionRecord.events)
		? transactionRecord.events.reduce<DryRunEventSummary[]>(
				(summaries, event) => {
					const summary = summarizeDryRunEvent(
						event,
						client,
						context.coinDecimals,
					);
					if (summary) {
						summaries.push(summary);
					}
					return summaries;
				},
				[],
			)
		: [];

	return {
		success,
		error,
		gasUsed: gasUsedSummary(effects, MIST_DECIMALS),
		balanceChanges,
		events,
	};
};
