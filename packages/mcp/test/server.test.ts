// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

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
				'suigar_build_coinflip_transaction',
				'suigar_build_limbo_transaction',
				'suigar_build_plinko_transaction',
				'suigar_build_pvp_coinflip_cancel_transaction',
				'suigar_build_pvp_coinflip_create_transaction',
				'suigar_build_pvp_coinflip_join_transaction',
				'suigar_build_range_transaction',
				'suigar_build_wheel_transaction',
				'suigar_read_config',
				'suigar_read_game_metadata',
			].sort(),
		);
		expect(Object.keys(server._registeredResources)).toContain(
			SUIGAR_MCP_APP_RESOURCE_URI,
		);
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
