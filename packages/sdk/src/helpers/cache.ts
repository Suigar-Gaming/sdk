// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export function getTtlCacheKey(ttlMs: number, now = Date.now()): string {
	return `ttl:${Math.floor(now / ttlMs)}`;
}
