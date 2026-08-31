import { describe, expect, it } from 'vitest';
import { equalBytes, HEX_32_BYTE_PATTERN, randomHex, randomUuid } from '../../src/utils/crypto.js';

describe('crypto utilities', () => {
	it('generates cryptographically random hex values of the requested byte length', () => {
		const value = randomHex(32);

		expect(value).toMatch(HEX_32_BYTE_PATTERN);
	});

	it('generates RFC 9562 version 4 UUIDs', () => {
		const value = randomUuid();

		expect(value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
	});

	it('compares byte arrays using the native Node implementation when available', async () => {
		expect(await equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
		expect(await equalBytes(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
		expect(await equalBytes(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
	});
});
