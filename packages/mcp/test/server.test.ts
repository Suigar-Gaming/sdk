// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { describe, expect, it } from 'vitest';
import {
	createSuigarMcpAppResourceResult,
	createSuigarMcpServer,
	SUIGAR_MCP_APP_RESOURCE_URI,
} from '../src/server.js';

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
		} finally {
			await client.close();
			await server.close();
		}
	});

	it('serves MCP App HTML with text fallback and CSP metadata', async () => {
		const result = await createSuigarMcpAppResourceResult();
		const [content] = result.contents;

		expect(content.uri).toBe(SUIGAR_MCP_APP_RESOURCE_URI);
		expect(content.mimeType).toBe('text/html;profile=mcp-app');
		expect(content.text).toContain('Suigar Transaction Inspector');
		expect(content._meta.ui.csp).toEqual({
			connectDomains: [],
			resourceDomains: [],
		});
	});
});
