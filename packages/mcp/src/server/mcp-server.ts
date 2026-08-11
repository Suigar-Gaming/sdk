// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { VERSION } from '../utils/index.js';
import {
	createSuigarMcpAppResourceMeta,
	createSuigarMcpAppResourceResult,
	SUIGAR_MCP_APP_RESOURCE_URI,
} from './app-resource.js';
import { registerSuigarTools } from './tool-registration.js';

export function createSuigarMcpServer(): McpServer {
	const server = new McpServer({
		name: 'suigar',
		version: VERSION,
		description:
			'Stdio MCP server and MCP App for inspecting Suigar config and building unsigned Suigar transactions on Sui.',
	});

	registerAppResource(
		server,
		'Suigar MCP Console',
		SUIGAR_MCP_APP_RESOURCE_URI,
		{
			title: 'Suigar MCP Console',
			description:
				'Compact MCP App UI for inspecting wallet balances and coin objects, Suigar config, game metadata, NFT and referral data, and transaction plans, summaries, dry-runs, and serialized bytes.',
			_meta: createSuigarMcpAppResourceMeta(),
		},
		createSuigarMcpAppResourceResult,
	);

	const APP_TOOL_META = {
		ui: {
			resourceUri: SUIGAR_MCP_APP_RESOURCE_URI,
		},
	} as const;

	registerSuigarTools(server, APP_TOOL_META);

	return server;
}

export async function startSuigarMcpServer(): Promise<void> {
	const server = createSuigarMcpServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
}
