// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeSuiAddress } from '@mysten/sui/utils';

import type { BetMetadataInput, EncodedBetMetadata } from '../types';

const ADDRESS_METADATA_KEYS = new Set(['referrer', 'partner']);
const textEncoder = new TextEncoder();

const parseHexAddress = (value: string): Uint8Array | null => {
	const trimmed = value.trim();
	if (!trimmed) return null;

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

export function encodeBetMetadata(
	metadata?: BetMetadataInput | null,
): EncodedBetMetadata {
	const keys: string[] = [];
	const values: number[][] = [];

	for (const [key, value] of Object.entries(metadata ?? {})) {
		if (value === undefined || value === null) {
			continue;
		}

		let encodedValue: number[];
		if (value instanceof Uint8Array) {
			encodedValue = Array.from(value);
		} else if (Array.isArray(value)) {
			encodedValue = value;
		} else if (typeof value === 'string' && ADDRESS_METADATA_KEYS.has(key)) {
			encodedValue = Array.from(
				parseHexAddress(value) ?? textEncoder.encode(value),
			);
		} else {
			encodedValue = Array.from(textEncoder.encode(String(value)));
		}

		keys.push(key);
		values.push(encodedValue);
	}

	return { keys, values };
}
