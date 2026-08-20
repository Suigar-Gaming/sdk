// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientCache } from '@mysten/sui/client';

type CacheEntry<Value> = {
	expiresAt: number;
	value: Value;
};

type CacheKey = Parameters<ClientCache['read']>[0];

type ReadCacheOptions = {
	ignoreCache?: boolean;
	ttlMs: number;
	sync?: boolean;
};

type ReadCacheParams<T> = {
	cache: ClientCache;
	key: CacheKey;
	load: () => T | Promise<T>;
	options: ReadCacheOptions;
};

type ReadCacheSyncParams<T> = {
	cache: ClientCache;
	key: CacheKey;
	load: () => T;
	options: ReadCacheOptions & { sync: true };
};

export function readCache<T>(params: ReadCacheSyncParams<T>): T;
export function readCache<T>(params: ReadCacheParams<T>): T | Promise<T>;
export function readCache<T>({
	cache,
	key,
	load,
	options,
}: ReadCacheParams<T> | ReadCacheSyncParams<T>): T | Promise<T> {
	if (options.ignoreCache) {
		cache.clear(key);
	}

	if (options.ttlMs <= 0) {
		cache.clear(key);
		return load();
	}

	const { ttlMs, sync } = options;

	const createEntry = (resolvedCache?: { cache: ClientCache; key: CacheKey }) => {
		const value = load();
		const entry: CacheEntry<T | Promise<T>> = {
			expiresAt: Date.now() + ttlMs,
			value,
		};

		if (isPromiseLike(value)) {
			entry.value = Promise.resolve(value)
				.then((resolved) => {
					resolvedCache?.cache.clear(resolvedCache.key);
					void resolvedCache?.cache.read<CacheEntry<T>>(resolvedCache.key, () => ({
						expiresAt: Date.now() + ttlMs,
						value: resolved,
					}));
					return resolved;
				})
				.catch((error) => {
					resolvedCache?.cache.clear(resolvedCache.key);
					throw error;
				});
		}

		return entry;
	};

	const readEntry = () =>
		sync
			? cache.readSync<CacheEntry<T>>(key, () => createEntry() as CacheEntry<T>)
			: cache.read<CacheEntry<T | Promise<T>>>(key, () => createEntry({ cache, key }));

	let cached = readEntry() as CacheEntry<T | Promise<T>>;

	if (cached.expiresAt > Date.now()) {
		return cached.value;
	}

	cache.clear(key);
	cached = readEntry() as CacheEntry<T | Promise<T>>;
	return cached.value;
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
	return (
		(typeof value === 'object' || typeof value === 'function') && value !== null && 'then' in value
	);
}
