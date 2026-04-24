// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { isValidSuiAddress, normalizeSuiAddress } from '@mysten/sui/utils';

import type { BetMetadataInput, EncodedBetMetadata } from '../types';

const ADDRESS_METADATA_KEYS = new Set(['partner']);
const RESERVED_METADATA_KEYS = new Set([...ADDRESS_METADATA_KEYS, 'referrer']);
const textEncoder = new TextEncoder();

const parseHexAddress = (value: string): Uint8Array | null => {
	const trimmed = value.trim();
	if (!trimmed || !isValidSuiAddress(trimmed)) return null;

	try {
		const normalized = normalizeSuiAddress(trimmed).slice(2);
		const bytes = new Uint8Array(normalized.length / 2);
		for (let index = 0; index < normalized.length; index += 2) {
			bytes[index / 2] = Number.parseInt(
				normalized.slice(index, index + 2),
				16,
			);
		}
		return bytes;
	} catch {
		return null;
	}
};

const encodeMetadataValue = (
	key: string,
	value: string | number | boolean | bigint | Uint8Array | number[],
) => {
	if (value instanceof Uint8Array) {
		return Array.from(value);
	}

	if (Array.isArray(value)) {
		return value;
	}

	if (typeof value === 'string' && ADDRESS_METADATA_KEYS.has(key)) {
		return Array.from(parseHexAddress(value) ?? textEncoder.encode(value));
	}

	return Array.from(textEncoder.encode(String(value)));
};

export function encodeBetMetadata(
	metadata?: BetMetadataInput | null,
	partner?: string,
): EncodedBetMetadata {
	const keys: string[] = [];
	const values: number[][] = [];

	for (const [key, value] of Object.entries(metadata ?? {})) {
		if (RESERVED_METADATA_KEYS.has(key)) {
			console.warn(
				`Metadata key "${key}" is reserved and will be ignored when parsing metadata.`,
			);
			continue;
		}

		if (value == null) {
			continue;
		}

		keys.push(key);
		values.push(encodeMetadataValue(key, value));
	}

	if (!partner?.trim()) {
		return { keys, values };
	}

	return {
		keys: [...keys, 'partner'],
		values: [...values, encodeMetadataValue('partner', partner)],
	};
}
