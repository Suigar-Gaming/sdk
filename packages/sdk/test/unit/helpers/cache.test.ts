// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { ClientCache } from '@mysten/sui/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readCache } from '../../../src/helpers/index.js';

describe('readCache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('reads async values through the client cache', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi.fn<() => Promise<string>>().mockResolvedValue('value');

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('value');
		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('value');

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('reads sync values through the client cache', () => {
		const cache = new ClientCache().scope('test');
		const load = vi.fn<() => string>().mockReturnValue('value');

		expect(readCache({ cache, key: ['key'], load, options: { sync: true, ttlMs: 1000 } })).toBe(
			'value',
		);
		expect(readCache({ cache, key: ['key'], load, options: { sync: true, ttlMs: 1000 } })).toBe(
			'value',
		);

		expect(load).toHaveBeenCalledTimes(1);
	});

	it('clears cached entries when ignored', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		await expect(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })).resolves.toBe(
			'first',
		);
		await expect(
			Promise.resolve(
				readCache({ cache, key: ['key'], load, options: { ignoreCache: true, ttlMs: 1000 } }),
			),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('reloads when ttl means no cache', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 0 } })),
		).resolves.toBe('first');
		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 0 } })),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('caches until the ttl expires from the load time', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		vi.setSystemTime(new Date('2026-01-01T00:00:00.999Z'));

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('first');

		vi.advanceTimersByTime(1);

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('first');

		vi.advanceTimersByTime(1000);

		await expect(
			Promise.resolve(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('clears failed async reads so the next call can retry', async () => {
		const cache = new ClientCache().scope('test');
		const load = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce('recovered');

		await expect(
			readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } }),
		).rejects.toThrow('boom');
		await expect(readCache({ cache, key: ['key'], load, options: { ttlMs: 1000 } })).resolves.toBe(
			'recovered',
		);

		expect(load).toHaveBeenCalledTimes(2);
	});
});
