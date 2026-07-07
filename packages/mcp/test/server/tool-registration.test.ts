// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { describe, expect, it } from 'vitest';
import type { ToolTextResult } from '../../src/runtime/types.js';
import { SUIGAR_MCP_APP_RESOURCE_URI } from '../../src/server/app-resource.js';
import {
	readOnlyToolAnnotations,
	registerSuigarInspectorTools,
	withToolErrors,
} from '../../src/server/tool-registration.js';

const appToolMeta = {
	ui: {
		resourceUri: SUIGAR_MCP_APP_RESOURCE_URI,
	},
} as const;

const inspectorToolNames = [
	'build_coinflip_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_pvp_coinflip_cancel_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_range_transaction',
	'build_wheel_transaction',
	'read_game_metadata',
];

const transactionToolAnnotations = {
	readOnlyHint: false,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
};

describe('MCP inspector tool registration', () => {
	it('registers the app-backed Suigar inspector tools with shared metadata', () => {
		const server = new McpServer({ name: 'suigar-test', version: '0.0.0' });

		registerSuigarInspectorTools(server, appToolMeta);

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
			inspectorToolNames.sort(),
		);
		expect(registeredTools.read_game_metadata).toMatchObject({
			title: 'Read Suigar Game Metadata',
			annotations: readOnlyToolAnnotations,
			_meta: appToolMeta,
		});
		expect(registeredTools.build_coinflip_transaction).toMatchObject({
			title: 'Build Coinflip Transaction',
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
			'The MCP server only builds unsigned transactions',
		);
	});
});
