// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { registerAppResource } from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	createSuigarMcpAppResourceResult,
	SUIGAR_MCP_APP_RESOURCE_URI,
} from './app-resource.js';
import { registerSuigarTools } from './tool-registration.js';

declare const __SUIGAR_MCP_VERSION__: string;

export const createSuigarMcpServer = () => {
	const server = new McpServer({
		name: 'suigar',
		version: __SUIGAR_MCP_VERSION__,
		description:
			'Stdio MCP server and MCP App for inspecting Suigar config and building unsigned Suigar transactions on Sui.',
	});

	registerAppResource(
		server,
		'Suigar Transaction Inspector',
		SUIGAR_MCP_APP_RESOURCE_URI,
		{
			title: 'Suigar Transaction Inspector',
			description:
				'Compact MCP App UI for inspecting Suigar config, transaction plans, summaries, dry-runs, and serialized bytes.',
			_meta: {
				ui: {
					csp: {
						connectDomains: [],
						resourceDomains: [],
					},
					prefersBorder: true,
				},
			},
		},
		createSuigarMcpAppResourceResult,
	);

	const appToolMeta = {
		ui: {
			resourceUri: SUIGAR_MCP_APP_RESOURCE_URI,
		},
	} as const;

	registerSuigarTools(server, appToolMeta);

	return server;
};

export const startSuigarMcpServer = async () => {
	const server = createSuigarMcpServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
};
