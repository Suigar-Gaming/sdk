// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';
import {
	NFT_IMAGE_RESOURCE_DOMAINS,
	SUIGAR_MCP_APP_RESOURCE_URI,
} from '../../src/server/app-resource.js';
import { createSuigarMcpServer } from '../../src/server/mcp-server.js';

const publicToolNames = [
	'build_coinflip_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_pvp_coinflip_cancel_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_range_transaction',
	'build_referral_commission_claim_transaction',
	'build_referral_level_up_usd_rewards_claim_transaction',
	'build_soccer_transaction',
	'build_wheel_transaction',
	'get_referral_commission',
	'get_referral_level_up_usd_rewards',
	'read_config',
	'read_game_metadata',
	'list_nfts',
];

const sorted = (values: Array<string>) => [...values].sort();

describe('MCP server registration', () => {
	it('wires the root config tool, inspector tools, and app resource', () => {
		const server = createSuigarMcpServer() as unknown as {
			_registeredTools: Record<string, unknown>;
			_registeredResources: Record<string, unknown>;
		};

		expect(sorted(Object.keys(server._registeredTools))).toEqual(
			sorted(publicToolNames),
		);
		expect(Object.keys(server._registeredResources)).toContain(
			SUIGAR_MCP_APP_RESOURCE_URI,
		);
	});

	it('exposes all public tools through MCP tools/list', async () => {
		const server = createSuigarMcpServer();
		const client = new Client({ name: 'suigar-test', version: '0.0.0' });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		try {
			await Promise.all([
				server.connect(serverTransport),
				client.connect(clientTransport),
			]);
			const result = await client.listTools();
			const serverVersion = client.getServerVersion();
			const serverCapabilities = client.getServerCapabilities();

			expect(sorted(result.tools.map((tool) => tool.name))).toEqual(
				sorted(publicToolNames),
			);
			expect(client.getServerCapabilities()?.tools).toEqual({
				listChanged: true,
			});
			expect(serverCapabilities?.resources).toEqual({ listChanged: true });
			expect(serverVersion?.description).toContain(
				'building unsigned Suigar transactions',
			);

			const readConfigTool = result.tools.find(
				(tool) => tool.name === 'read_config',
			);
			const readGameMetadataTool = result.tools.find(
				(tool) => tool.name === 'read_game_metadata',
			);
			expect(readConfigTool).toMatchObject({
				title: 'Read Suigar Config',
				execution: { taskSupport: 'forbidden' },
			});
			expect(readConfigTool?.inputSchema).toMatchObject({
				type: 'object',
				additionalProperties: false,
			});
			expect(readConfigTool?.outputSchema).toMatchObject({
				type: 'object',
			});
			expect(readGameMetadataTool).toMatchObject({
				title: 'Read Suigar Game Metadata',
				execution: { taskSupport: 'forbidden' },
			});
			expect(readGameMetadataTool?._meta).toMatchObject({
				ui: { resourceUri: SUIGAR_MCP_APP_RESOURCE_URI },
			});
			const listNftsTool = result.tools.find(
				(tool) => tool.name === 'list_nfts',
			);
			expect(listNftsTool).toMatchObject({
				title: 'List Suigar NFTs',
				execution: { taskSupport: 'forbidden' },
				_meta: { ui: { resourceUri: SUIGAR_MCP_APP_RESOURCE_URI } },
			});
		} finally {
			await client.close();
			await server.close();
		}
	});

	it('uses the current SDK protocol and exposes app resource metadata', async () => {
		const server = createSuigarMcpServer();
		const client = new Client({ name: 'suigar-test', version: '0.0.0' });
		const [clientTransport, serverTransport] =
			InMemoryTransport.createLinkedPair();

		try {
			await Promise.all([
				server.connect(serverTransport),
				client.connect(clientTransport),
			]);

			expect(LATEST_PROTOCOL_VERSION).toBe('2025-11-25');

			const result = await client.listResources();
			const appResource = result.resources.find(
				(resource) => resource.uri === SUIGAR_MCP_APP_RESOURCE_URI,
			);

			expect(appResource).toMatchObject({
				name: 'Suigar Transaction Inspector',
				title: 'Suigar Transaction Inspector',
				mimeType: 'text/html;profile=mcp-app',
				_meta: {
					ui: {
						csp: {
							connectDomains: [],
							resourceDomains: [...NFT_IMAGE_RESOURCE_DOMAINS],
						},
						prefersBorder: true,
					},
				},
			});
		} finally {
			await client.close();
			await server.close();
		}
	});
});
