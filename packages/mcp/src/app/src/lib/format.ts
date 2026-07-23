// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { AnyRecord, DefinitionEntry } from './types.js';

export const asRecord = (value: unknown): AnyRecord =>
	value && typeof value === 'object' ? (value as AnyRecord) : {};

export const isRecord = (value: unknown): value is AnyRecord =>
	value !== null && typeof value === 'object';

export const stringify = (value: unknown) =>
	JSON.stringify(
		value,
		(_key, item) => (typeof item === 'bigint' ? item.toString() : item),
		2,
	);

export const formatValue = (value: unknown) => {
	if (Array.isArray(value)) {
		return value.length > 0 ? value.join(', ') : null;
	}
	if (value && typeof value === 'object') {
		const record = asRecord(value);
		if (typeof record.label === 'string' && typeof record.id === 'string') {
			return `${record.label} (${record.id})`;
		}
		if (typeof record.id === 'string') {
			return record.id;
		}
		return stringify(value);
	}
	return value;
};

export const labelFor = (key: string) =>
	key
		.replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
		.replace(/_/gu, ' ')
		.replace(/\b\w/gu, (character) => character.toUpperCase());

export const dynamicEntries = (record: AnyRecord): Array<DefinitionEntry> =>
	Object.entries(record).reduce<Array<DefinitionEntry>>(
		(entries, [key, value]) => {
			if (
				key.endsWith('_display') ||
				[
					'game_details',
					'metadata',
					'player',
					'coin_type',
					'unsafe_oracle_usd_coin_price',
					'adjusted_oracle_usd_coin_price',
				].includes(key)
			) {
				return entries;
			}
			entries.push([labelFor(key), record[`${key}_display`] ?? value]);
			return entries;
		},
		[],
	);

export const amountText = (value: unknown) => {
	const amount = asRecord(value);
	if (typeof amount.display === 'string' && typeof amount.raw === 'string') {
		return `${amount.display} (${amount.raw} base units)`;
	}
	return value;
};

export const visibleDefinitionEntries = (entries: Array<DefinitionEntry>) =>
	entries.reduce<Array<DefinitionEntry>>((visibleEntries, [label, value]) => {
		const formattedValue = formatValue(value);
		if (formattedValue != null && formattedValue !== '') {
			visibleEntries.push([label, formattedValue]);
		}
		return visibleEntries;
	}, []);

export const valueTone = (
	label: string,
	value: unknown,
): 'error' | 'success' | null => {
	const text = String(value).toLowerCase();
	const lowerLabel = label.toLowerCase();
	if (text === 'success') {
		return 'success';
	}
	if (value === false || lowerLabel.includes('error') || text === 'failed') {
		return 'error';
	}
	return null;
};
