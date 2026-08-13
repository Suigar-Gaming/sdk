// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { buildNftV1MintTransactionInputSchema } from '../../../src/tools/schemas/nft.js';

describe('NFT input schemas', () => {
	it('accepts NFT V1 mint inputs', () => {
		expect(
			buildNftV1MintTransactionInputSchema.parse({
				owner: '0x123',
				specId: '0x456',
				useGasCoin: true,
			}),
		).toMatchObject({ specId: '0x456', useGasCoin: true });
	});
});
