// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TtlClientCache } from '../../src/ttl-cache.js';

describe('TtlClientCache', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('caches sync reads until the ttl expires', () => {
		const cache = new TtlClientCache({ ttlMs: 1000 });
		const load = vi.fn(() => 'value');

		expect(cache.readSync(['key'], load)).toBe('value');
		expect(cache.readSync(['key'], load)).toBe('value');
		expect(load).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1001);

		expect(cache.readSync(['key'], load)).toBe('value');
		expect(load).toHaveBeenCalledTimes(2);
	});

	it('supports force refreshing sync reads', () => {
		const cache = new TtlClientCache({ ttlMs: 1000 });
		const load = vi.fn(() => 'value');

		expect(cache.readSync(['key'], load)).toBe('value');
		expect(
			cache.readSync(['key'], load, {
				ignoreCache: true,
			}),
		).toBe('value');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('shares in-flight async reads and caches the resolved value', async () => {
		const cache = new TtlClientCache({ ttlMs: 1000 });
		const load = vi.fn(
			() =>
				new Promise<string>((resolve) => {
					setTimeout(() => resolve('resolved'), 10);
				}),
		);

		const first = cache.read(['key'], load);
		const second = cache.read(['key'], load);

		expect(load).toHaveBeenCalledTimes(1);
		expect(first).toBe(second);

		await vi.advanceTimersByTimeAsync(10);
		await expect(first).resolves.toBe('resolved');

		expect(await cache.read(['key'], load)).toBe('resolved');
		expect(load).toHaveBeenCalledTimes(1);

		vi.advanceTimersByTime(1001);

		const third = cache.read(['key'], load);
		expect(load).toHaveBeenCalledTimes(2);
		await vi.advanceTimersByTimeAsync(10);
		await expect(third).resolves.toBe('resolved');
	});

	it('supports force refreshing async reads', async () => {
		const cache = new TtlClientCache({ ttlMs: 1000 });
		const load = vi
			.fn<() => Promise<string>>()
			.mockResolvedValueOnce('first')
			.mockResolvedValueOnce('second');

		await expect(cache.read(['key'], load)).resolves.toBe('first');
		await expect(
			cache.read(['key'], load, {
				ignoreCache: true,
			}),
		).resolves.toBe('second');

		expect(load).toHaveBeenCalledTimes(2);
	});

	it('clears failed async reads so the next call can retry', async () => {
		const cache = new TtlClientCache({ ttlMs: 1000 });
		const load = vi
			.fn<() => Promise<string>>()
			.mockRejectedValueOnce(new Error('boom'))
			.mockResolvedValueOnce('recovered');

		await expect(cache.read(['key'], load)).rejects.toThrow('boom');
		await expect(cache.read(['key'], load)).resolves.toBe('recovered');

		expect(load).toHaveBeenCalledTimes(2);
	});
});
