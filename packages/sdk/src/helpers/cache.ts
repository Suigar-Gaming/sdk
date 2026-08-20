// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientCache } from '@mysten/sui/client';

const NO_CACHE_TTL_KEY = 'ttl:no-cache';

type CacheKey = Parameters<ClientCache['read']>[0];

type ReadCacheOptions = {
	ignoreCache?: boolean;
	ttlMs?: number;
	sync?: boolean;
};

type ReadCacheParams<T> = {
	cache: ClientCache;
	key: CacheKey;
	load: () => T | Promise<T>;
	options?: ReadCacheOptions;
};

type ReadCacheSyncParams<T> = {
	cache: ClientCache;
	key: CacheKey;
	load: () => T;
	options: ReadCacheOptions & { sync: true };
};

function getTtlCacheKey(ttlMs: number, now = Date.now()): string {
	if (isNoCacheTtl(ttlMs)) {
		return NO_CACHE_TTL_KEY;
	}

	return `ttl:${Math.floor(now / ttlMs)}`;
}

function isNoCacheTtl(ttlMs: number): boolean {
	return ttlMs <= 0;
}

export function readCache<T>(params: ReadCacheSyncParams<T>): T;
export function readCache<T>(params: ReadCacheParams<T>): T | Promise<T>;
export function readCache<T>({
	cache,
	key,
	load,
	options = {},
}: ReadCacheParams<T> | ReadCacheSyncParams<T>): T | Promise<T> {
	const readKey = getCacheReadKey(key, options.ttlMs);

	if (options.ignoreCache || (options.ttlMs !== undefined && isNoCacheTtl(options.ttlMs))) {
		cache.clear(key);
	}

	return options.sync ? cache.readSync(readKey, load as () => T) : cache.read(readKey, load);
}

function getCacheReadKey(key: CacheKey, ttlMs?: number): CacheKey {
	return ttlMs === undefined ? key : [...key, getTtlCacheKey(ttlMs)];
}
