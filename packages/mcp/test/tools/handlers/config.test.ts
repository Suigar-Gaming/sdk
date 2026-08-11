// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { readConfigTool } from '../../../src/tools/handlers/index.js';

describe('read_config', () => {
	it('defaults to testnet and returns SDK-shaped config', async () => {
		const result = await readConfigTool({});
		const content = result.structuredContent as Awaited<
			ReturnType<typeof readConfigTool>
		>['structuredContent'] & {
			supportedGames: Array<{ id: string }>;
			supportedFeatures: Array<{ id: string; tools: Array<string> }>;
		};

		expect(content.network).toBe('testnet');
		expect(content.config.sdk.packageIds.coinflip).toMatch(/^0x/u);
		expect(content.config.sdk.packageIds.soccer).toMatch(/^0x/u);
		expect(content.config.sdk.objectIds.sweetHouse).toMatch(/^0x/u);
		expect(content.config.sdk.coins.sui.coinType).toMatch(/::/u);
		expect(content.supportedGames.map((game) => game.id)).toContain(
			'pvp-coinflip',
		);
		expect(content.supportedFeatures).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					id: 'nfts',
					tools: ['list_nfts', 'build_nft_v1_mint_transaction'],
				}),
				expect.objectContaining({
					id: 'referrals',
					tools: expect.arrayContaining([
						'get_referral_commission',
						'build_referral_commission_claim_transaction',
					]),
				}),
			]),
		);
	});
});
