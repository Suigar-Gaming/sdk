// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { fromHex } from '@mysten/sui/utils';

import type {
	BetMetadataInput,
	BetMetadataValue,
	EncodedBetMetadata,
} from '../types';

const ADDRESS_METADATA_KEYS = new Set(['partner']);
const RESERVED_METADATA_KEYS = new Set([...ADDRESS_METADATA_KEYS, 'referrer']);
const textEncoder = new TextEncoder();

function parseHexAddress(value: string): ReturnType<typeof fromHex> | null {
	try {
		return fromHex(value);
	} catch {
		return null;
	}
}

function encodeMetadataValue(key: string, value: BetMetadataValue) {
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
		values.push(encodeMetadataValue(key, value));
	}

	if (partner?.trim()) {
		keys.unshift('partner');
		values.unshift(encodeMetadataValue('partner', partner));
	}

	return {
		keys,
		values,
	};
}
