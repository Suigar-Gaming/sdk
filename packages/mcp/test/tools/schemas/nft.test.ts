// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { buildNftV1MintTransactionInputSchema } from '../../../src/tools/schemas/nft.js';

const testAddress = (fill: string) => `0x${fill.repeat(64)}`;
const owner = testAddress('a');
const specId = testAddress('b');

describe('NFT input schemas', () => {
	it('accepts NFT V1 mint inputs', () => {
		expect(
			buildNftV1MintTransactionInputSchema.parse({
				owner,
				specId,
				useGasCoin: true,
			}),
		).toMatchObject({ specId, useGasCoin: true });
	});

	it('requires build inputs unless read-only planning is requested', () => {
		expect(buildNftV1MintTransactionInputSchema.parse({ mode: 'read-only' }).mode).toBe(
			'read-only',
		);
		expect(() => buildNftV1MintTransactionInputSchema.parse({ owner })).toThrow(
			/specId is required/u,
		);
	});
});
