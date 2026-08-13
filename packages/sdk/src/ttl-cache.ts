// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { ClientCache, type ClientCacheOptions } from '@mysten/sui/client';

type CacheEntry<Value> = {
	expiresAt: number;
	value: Value;
};

type TtlClientCacheReadOptions = {
	ignoreCache?: boolean;
};

export class TtlClientCache extends ClientCache {
	#ttlMs: number;

	constructor({ ttlMs, ...options }: ClientCacheOptions & { ttlMs: number }) {
		super({
			...options,
			prefix: options.prefix ?? ['ttl'],
		});
		this.#ttlMs = ttlMs;
	}

	override read<T>(
		key: [string, ...Array<string>],
		load: () => T | Promise<T>,
		options?: TtlClientCacheReadOptions,
	): T | Promise<T> {
		if (options?.ignoreCache) {
			super.clear(key);
		}

		if (this.#ttlMs <= 0) {
			return load();
		}

		const cached = super.read<CacheEntry<T | Promise<T>>>(key, () =>
			this.#loadEntry(key, load),
		) as CacheEntry<T | Promise<T>>;

		if (cached && cached.expiresAt > Date.now()) {
			return cached.value as T;
		}

		super.clear(key);
		return (
			super.read<CacheEntry<T | Promise<T>>>(key, () => this.#loadEntry(key, load)) as CacheEntry<
				T | Promise<T>
			>
		).value as T | Promise<T>;
	}

	override readSync<T>(
		key: [string, ...Array<string>],
		load: () => T,
		options?: TtlClientCacheReadOptions,
	): T {
		if (options?.ignoreCache) {
			super.clear(key);
		}

		if (this.#ttlMs <= 0) {
			return load();
		}

		const cached = super.readSync<CacheEntry<T>>(key, () => this.#loadSyncEntry(load));

		if (cached.expiresAt > Date.now()) {
			return cached.value;
		}

		super.clear(key);
		return super.readSync<CacheEntry<T>>(key, () => this.#loadSyncEntry(load)).value;
	}

	#loadEntry<T>(
		key: [string, ...Array<string>],
		load: () => T | Promise<T>,
	): CacheEntry<T | Promise<T>> {
		const value = load();
		const entry: CacheEntry<T | Promise<T>> = {
			value,
			expiresAt: Date.now() + this.#ttlMs,
		};

		if (isPromiseLike(value)) {
			entry.value = Promise.resolve(value)
				.then((resolved) => {
					super.clear(key);
					void super.read<CacheEntry<T>>(key, () => ({
						value: resolved,
						expiresAt: Date.now() + this.#ttlMs,
					}));
					return resolved as T;
				})
				.catch((error) => {
					super.clear(key);
					throw error;
				});
		}

		return entry;
	}

	#loadSyncEntry<T>(load: () => T): CacheEntry<T> {
		return {
			value: load(),
			expiresAt: Date.now() + this.#ttlMs,
		};
	}
}

function isPromiseLike<T>(value: T | Promise<T>): value is Promise<T> {
	return (
		(typeof value === 'object' || typeof value === 'function') && value !== null && 'then' in value
	);
}
