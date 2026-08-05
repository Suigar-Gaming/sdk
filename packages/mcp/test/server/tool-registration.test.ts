// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it } from 'vitest';
import type { ToolTextResult } from '../../src/runtime/types.js';
import { SUIGAR_MCP_APP_RESOURCE_URI } from '../../src/server/app-resource.js';
import {
	readOnlyToolAnnotations,
	registerSuigarTools,
	withToolErrors,
} from '../../src/server/tool-registration.js';

const appToolMeta = {
	ui: {
		resourceUri: SUIGAR_MCP_APP_RESOURCE_URI,
	},
} as const;

const registeredToolNames = [
	'read_config',
	'read_game_metadata',
	'list_nfts',
	'get_wallet_balances',
	'list_wallet_coins',
	'get_execution_status',
	'get_session_wallet',
	'fund_session_wallet',
	'get_connection_status',
	'suigar_login',
	'suigar_logout',
	'setup_session_wallet',
	'get_referral_commission',
	'get_referral_level_up_usd_rewards',
	'build_referral_commission_claim_transaction',
	'build_referral_level_up_usd_rewards_claim_transaction',
	'build_nft_v1_mint_transaction',
	'build_coinflip_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_pvp_coinflip_cancel_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_range_transaction',
	'build_soccer_transaction',
	'build_wheel_transaction',
];

const transactionToolAnnotations = {
	readOnlyHint: false,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
};

const appToolNames = [
	'get_session_wallet',
	'get_execution_status',
	'get_wallet_balances',
	'list_wallet_coins',
	'read_config',
	'read_game_metadata',
	'list_nfts',
	'get_referral_commission',
	'get_referral_level_up_usd_rewards',
	'build_referral_commission_claim_transaction',
	'build_referral_level_up_usd_rewards_claim_transaction',
	'build_nft_v1_mint_transaction',
	'build_coinflip_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_pvp_coinflip_cancel_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_range_transaction',
	'build_soccer_transaction',
	'build_wheel_transaction',
];

const nonAppToolNames = [
	'setup_session_wallet',
	'fund_session_wallet',
	'suigar_login',
	'suigar_logout',
	'get_connection_status',
];

describe('MCP tool registration', () => {
	it('registers all Suigar tools with shared definitions', () => {
		const server = new McpServer({ name: 'suigar-test', version: '0.0.0' });

		registerSuigarTools(server, appToolMeta);

		const registeredTools = (
			server as unknown as {
				_registeredTools: Record<
					string,
					{
						title?: string;
						inputSchema?: unknown;
						outputSchema?: unknown;
						annotations?: unknown;
						_meta?: unknown;
					}
				>;
			}
		)._registeredTools;

		expect(Object.keys(registeredTools).sort()).toEqual(
			registeredToolNames.sort(),
		);
		expect([...appToolNames, ...nonAppToolNames].sort()).toEqual(
			registeredToolNames.sort(),
		);
		expect(registeredTools.read_config).toMatchObject({
			title: 'Read Suigar Config',
			annotations: readOnlyToolAnnotations,
		});
		expect(registeredTools.read_config._meta).toMatchObject(appToolMeta);
		expect(registeredTools.read_game_metadata).toMatchObject({
			title: 'Read Suigar Game Metadata',
			annotations: readOnlyToolAnnotations,
		});
		expect(registeredTools.read_game_metadata._meta).toMatchObject(appToolMeta);
		expect(registeredTools.list_nfts).toMatchObject({
			title: 'List Suigar NFTs',
			annotations: readOnlyToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools.build_coinflip_transaction).toMatchObject({
			title: 'Build Coinflip Transaction',
			annotations: transactionToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools.build_nft_v1_mint_transaction).toMatchObject({
			title: 'Build NFT V1 Mint Transaction',
			annotations: transactionToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools.build_pvp_coinflip_create_transaction).toMatchObject(
			{
				title: 'Build PvP Coinflip Create',
				annotations: transactionToolAnnotations,
				_meta: appToolMeta,
			},
		);
		for (const name of appToolNames) {
			expect(registeredTools[name]?._meta).toMatchObject(appToolMeta);
		}
		for (const name of nonAppToolNames) {
			expect(registeredTools[name]?._meta).toBeUndefined();
		}

		for (const tool of Object.values(registeredTools)) {
			expect(tool.inputSchema).toBeDefined();
			expect(tool.outputSchema).toBeDefined();
		}
	});

	it('wraps thrown handler failures as MCP tool errors', async () => {
		const failingHandler = async (): Promise<ToolTextResult> => {
			throw new TypeError('bad input');
		};

		const result = await withToolErrors(failingHandler)({});

		expect(result).toMatchObject({
			isError: true,
			content: [
				{
					type: 'text',
				},
			],
		});
		expect(result.content[0]?.text).toContain('TypeError: bad input');
		expect(result.content[0]?.text).toContain(
			'Check required fields, network, coin type, and SDK config overrides.',
		);
		expect(result.structuredContent).toEqual({
			errors: [
				'TypeError: bad input',
				'Check required fields, network, coin type, and SDK config overrides.',
			],
		});
	});
});
