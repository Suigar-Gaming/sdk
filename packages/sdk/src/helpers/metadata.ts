// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { fromHex } from '@mysten/sui/utils';
import type {
	BetMetadataInput,
	BetMetadataValue,
	EncodedBetMetadata,
} from '../types/index.js';

const PARTNER_METADATA_KEY = 'partner';

const RESERVED_METADATA_KEYS = new Set([PARTNER_METADATA_KEY, 'referrer']);
const textEncoder = new TextEncoder();

function encodeString(value: string) {
	try {
		return fromHex(value);
	} catch {
		return textEncoder.encode(value);
	}
}

function encodeMetadataValue(value: BetMetadataValue) {
	if (value instanceof Uint8Array) {
		return Array.from(value);
	}

	if (Array.isArray(value)) {
		return value;
	}

	return Array.from(encodeString(String(value)));
}

export function encodeBetMetadata(
	metadata?: BetMetadataInput,
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
		values.push(encodeMetadataValue(value));
	}

	if (partner?.trim()) {
		keys.unshift(PARTNER_METADATA_KEY);
		values.unshift(encodeMetadataValue(partner));
	}

	return {
		keys,
		values,
	};
}
