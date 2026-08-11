// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	LOCALHOST_HOST,
	LOOPBACK_HOST,
	LOOPBACK_ORIGIN,
	loopbackOrigin,
} from '../../src/wallet/loopback.js';

describe('wallet loopback helpers', () => {
	it('centralizes loopback host values', () => {
		expect(LOOPBACK_HOST).toBe('127.0.0.1');
		expect(LOCALHOST_HOST).toBe('localhost');
		expect(LOOPBACK_ORIGIN).toBe('http://127.0.0.1');
	});

	it('formats loopback origins for numeric and string ports', () => {
		expect(loopbackOrigin(12345)).toBe('http://127.0.0.1:12345');
		expect(loopbackOrigin('54321')).toBe('http://127.0.0.1:54321');
	});
});
