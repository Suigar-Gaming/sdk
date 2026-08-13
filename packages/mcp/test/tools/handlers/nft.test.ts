// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import type { ReadOnlyPlan } from '../../../src/runtime/types.js';
import { buildNftV1MintTransactionTool, listNftsTool } from '../../../src/tools/handlers/index.js';

describe('list_nfts', () => {
	it('requires an owner when listing NFTs', async () => {
		await expect(listNftsTool({})).rejects.toThrow('Missing required field: owner.');
	});
});

describe('build_nft_v1_mint_transaction', () => {
	it('returns a read-only plan', async () => {
		const result = await buildNftV1MintTransactionTool({ mode: 'read-only' });
		const content = result.structuredContent as ReadOnlyPlan;

		expect(content.mode).toBe('read-only');
		expect(content.network).toBe('testnet');
		expect(content.plan.target).toMatch(/^0x.*::/u);
		expect(result.content[0].text).toContain('"read-only"');
	});

	it('returns an NFT V1 mint plan with its resolved configuration', async () => {
		const result = await buildNftV1MintTransactionTool({
			mode: 'read-only',
		});
		const content = result.structuredContent as {
			plan: { target: string; requiredInputs: Array<string> };
			nft: { packageId: string; factoryId: string };
		};

		expect(content.plan.target).toMatch(/::nft::mint_to_sender$/u);
		expect(content.plan.requiredInputs).toEqual(['owner', 'specId']);
		expect(content.nft.packageId).toMatch(/^0x/u);
		expect(content.nft.factoryId).toMatch(/^0x/u);
	});
});
