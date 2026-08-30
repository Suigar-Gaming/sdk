// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex, equalBytes as nobleEqualBytes, randomBytes } from '@noble/ciphers/utils.js';

const UUID_BYTE_TO_HEX = Array.from({ length: 256 }, (_, byte) =>
	byte.toString(16).padStart(2, '0'),
);

const nodeTimingSafeEqual = import('node:crypto')
	.then(({ timingSafeEqual }) => timingSafeEqual)
	.catch(() => null);

export async function equalBytes(a: Uint8Array, b: Uint8Array): Promise<boolean> {
	if (a.length !== b.length) {
		return false;
	}

	const timingSafeEqual = await nodeTimingSafeEqual;
	return timingSafeEqual === null ? nobleEqualBytes(a, b) : timingSafeEqual(a, b);
}

export function randomHex(byteLength: number): string {
	return bytesToHex(randomBytes(byteLength));
}

export function randomUuid(): string {
	const globalCrypto = typeof globalThis === 'object' ? globalThis.crypto : null;
	if (typeof globalCrypto?.randomUUID === 'function') {
		return globalCrypto.randomUUID();
	}

	const bytes = randomBytes(16);
	bytes[6] = (bytes[6] & 0x0f) | 0x40;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	return `${UUID_BYTE_TO_HEX[bytes[0]]}${UUID_BYTE_TO_HEX[bytes[1]]}${UUID_BYTE_TO_HEX[bytes[2]]}${UUID_BYTE_TO_HEX[bytes[3]]}-${UUID_BYTE_TO_HEX[bytes[4]]}${UUID_BYTE_TO_HEX[bytes[5]]}-${UUID_BYTE_TO_HEX[bytes[6]]}${UUID_BYTE_TO_HEX[bytes[7]]}-${UUID_BYTE_TO_HEX[bytes[8]]}${UUID_BYTE_TO_HEX[bytes[9]]}-${UUID_BYTE_TO_HEX[bytes[10]]}${UUID_BYTE_TO_HEX[bytes[11]]}${UUID_BYTE_TO_HEX[bytes[12]]}${UUID_BYTE_TO_HEX[bytes[13]]}${UUID_BYTE_TO_HEX[bytes[14]]}${UUID_BYTE_TO_HEX[bytes[15]]}`;
}
