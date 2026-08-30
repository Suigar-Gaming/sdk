import { equalBytes } from '@noble/ciphers/utils.js';
import { describe, expect, it } from 'vitest';
import { randomHex, randomUuid } from '../../src/utils/crypto.js';

describe('crypto utilities', () => {
	it('generates cryptographically random hex values of the requested byte length', () => {
		const value = randomHex(32);

		expect(value).toMatch(/^[0-9a-f]{64}$/u);
	});

	it('generates RFC 9562 version 4 UUIDs', () => {
		const value = randomUuid();

		expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
	});

	it('compares byte arrays without early exit for matching lengths', () => {
		expect(equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
		expect(equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
		expect(equalBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
	});
});
