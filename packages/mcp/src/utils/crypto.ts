// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bytesToHex, randomBytes } from '@noble/ciphers/utils.js';

export function randomHex(byteLength: number): string {
	return bytesToHex(randomBytes(byteLength));
}

export function randomUuid(): string {
	return globalThis.crypto.randomUUID();
}
