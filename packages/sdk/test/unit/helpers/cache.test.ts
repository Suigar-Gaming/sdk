// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { getTtlCacheKey } from '../../../src/helpers/index.js';

describe('getTtlCacheKey', () => {
	it('uses the same key within a ttl bucket', () => {
		expect(getTtlCacheKey(1000, 1000)).toBe(getTtlCacheKey(1000, 1999));
	});

	it('uses a different key across ttl buckets', () => {
		expect(getTtlCacheKey(1000, 1999)).not.toBe(getTtlCacheKey(1000, 2000));
	});
});
