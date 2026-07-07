// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { LATEST_PROTOCOL_VERSION } from '@modelcontextprotocol/sdk/types.js';
import { describe, expect, it } from 'vitest';
import { createSuigarMcpServer } from '../../src/server.js';
import { SUIGAR_MCP_APP_RESOURCE_URI } from '../../src/server/app-resource.js';

describe('MCP server registration', () => {
	it('registers all public Suigar MCP tools', () => {
		const server = createSuigarMcpServer() as unknown as {
			_registeredTools: Record<string, unknown>;
			_registeredResources: Record<string, unknown>;
		};

		expect(Object.keys(server._registeredTools).sort()).toEqual(
			[
				'build_coinflip_transaction',
				'build_limbo_transaction',
				'build_plinko_transaction',
				'build_pvp_coinflip_cancel_transaction',
				'build_pvp_coinflip_create_transaction',
				'build_pvp_coinflip_join_transaction',
				'build_range_transaction',
				'build_wheel_transaction',
				'read_config',
				'read_game_metadata',
			].sort(),
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

			expect(result.tools.map((tool) => tool.name).sort()).toEqual(
				[
					'build_coinflip_transaction',
					'build_limbo_transaction',
					'build_plinko_transaction',
					'build_pvp_coinflip_cancel_transaction',
					'build_pvp_coinflip_create_transaction',
					'build_pvp_coinflip_join_transaction',
					'build_range_transaction',
					'build_wheel_transaction',
					'read_config',
					'read_game_metadata',
				].sort(),
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
							resourceDomains: [],
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
