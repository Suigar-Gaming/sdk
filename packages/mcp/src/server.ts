// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import {
	registerAppResource,
	registerAppTool,
	RESOURCE_MIME_TYPE,
} from '@modelcontextprotocol/ext-apps/server';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	coinflipInputSchema,
	configIdInputSchema,
	limboInputSchema,
	pvpCoinflipCancelInputSchema,
	pvpCoinflipCreateInputSchema,
	pvpCoinflipJoinInputSchema,
	rangeInputSchema,
	readConfigInputSchema,
	readGameMetadataInputSchema,
	toolOutputSchema,
} from './schemas.js';
import {
	buildCoinflipTransactionTool,
	buildLimboTransactionTool,
	buildPlinkoTransactionTool,
	buildPvpCoinflipCancelTransactionTool,
	buildPvpCoinflipCreateTransactionTool,
	buildPvpCoinflipJoinTransactionTool,
	buildRangeTransactionTool,
	buildWheelTransactionTool,
	readConfigTool,
	readGameMetadataTool,
} from './tools.js';
import type { ToolTextResult } from './types.js';

export const SUIGAR_MCP_APP_RESOURCE_URI =
	'ui://suigar/transaction-inspector.html';

const packageJson = JSON.parse(
	readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
) as { version: string };

const errorText = (error: unknown) => {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
};

const hasErrorCode = (
	error: unknown,
	code: string,
): error is Error & { code: string } =>
	error instanceof Error &&
	'code' in error &&
	(error as { code: unknown }).code === code;

const withToolErrors =
	<TInput>(handler: (input: TInput) => Promise<ToolTextResult>) =>
	async (
		input: TInput,
	): Promise<
		| ToolTextResult
		| { isError: true; content: [{ type: 'text'; text: string }] }
	> => {
		try {
			return await handler(input);
		} catch (error) {
			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: `${errorText(error)}\n\nCheck required fields, network, coin type, and SDK config overrides. The MCP server only builds unsigned transactions and never signs or executes them.`,
					},
				],
			};
		}
	};

export const readSuigarMcpAppHtml = async () => {
	try {
		return await readFile(new URL('./app/index.html', import.meta.url), 'utf8');
	} catch (error) {
		if (!hasErrorCode(error, 'ENOENT')) {
			throw error;
		}
		throw new Error('Unable to find bundled Suigar MCP App HTML.', {
			cause: error,
		});
	}
};

export const createSuigarMcpAppResourceResult = async () => ({
	contents: [
		{
			uri: SUIGAR_MCP_APP_RESOURCE_URI,
			mimeType: RESOURCE_MIME_TYPE,
			text: await readSuigarMcpAppHtml(),
			_meta: {
				ui: {
					csp: {
						connectDomains: [],
						resourceDomains: [],
					},
				},
			},
		},
	],
});

export const createSuigarMcpServer = () => {
	const server = new McpServer({
		name: 'suigar',
		version: packageJson.version,
	});

	server.registerTool(
		'read_config',
		{
			title: 'Read Suigar Config',
			description:
				'Resolve Suigar SDK config for mainnet or testnet. Defaults to testnet.',
			inputSchema: readConfigInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
		},
		withToolErrors(readConfigTool),
	);

	registerAppResource(
		server,
		'Suigar Transaction Inspector',
		SUIGAR_MCP_APP_RESOURCE_URI,
		{
			description:
				'Compact MCP App UI for inspecting Suigar config, transaction plans, summaries, dry-runs, and serialized bytes.',
		},
		createSuigarMcpAppResourceResult,
	);

	const appToolMeta = {
		ui: {
			resourceUri: SUIGAR_MCP_APP_RESOURCE_URI,
		},
	};

	registerAppTool(
		server,
		'read_game_metadata',
		{
			title: 'Read Suigar Game Metadata',
			description:
				'Read SDK-backed metadata for a supported Suigar game and coin type.',
			inputSchema: readGameMetadataInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: true,
				destructiveHint: false,
				idempotentHint: true,
				openWorldHint: false,
			},
			_meta: appToolMeta,
		},
		withToolErrors(readGameMetadataTool),
	);

	registerAppTool(
		server,
		'build_coinflip_transaction',
		{
			title: 'Build Coinflip Transaction',
			description:
				'Build, dry-run, or inspect an unsigned Suigar coinflip transaction.',
			inputSchema: coinflipInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildCoinflipTransactionTool),
	);

	registerAppTool(
		server,
		'build_limbo_transaction',
		{
			title: 'Build Limbo Transaction',
			description:
				'Build, dry-run, or inspect an unsigned Suigar limbo transaction.',
			inputSchema: limboInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildLimboTransactionTool),
	);

	registerAppTool(
		server,
		'build_plinko_transaction',
		{
			title: 'Build Plinko Transaction',
			description:
				'Build, dry-run, or inspect an unsigned Suigar plinko transaction.',
			inputSchema: configIdInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildPlinkoTransactionTool),
	);

	registerAppTool(
		server,
		'build_wheel_transaction',
		{
			title: 'Build Wheel Transaction',
			description:
				'Build, dry-run, or inspect an unsigned Suigar wheel transaction.',
			inputSchema: configIdInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildWheelTransactionTool),
	);

	registerAppTool(
		server,
		'build_range_transaction',
		{
			title: 'Build Range Transaction',
			description:
				'Build, dry-run, or inspect an unsigned Suigar range transaction.',
			inputSchema: rangeInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildRangeTransactionTool),
	);

	registerAppTool(
		server,
		'build_pvp_coinflip_create_transaction',
		{
			title: 'Build PvP Coinflip Create',
			description:
				'Build, dry-run, or inspect an unsigned Suigar PvP coinflip lobby creation transaction.',
			inputSchema: pvpCoinflipCreateInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildPvpCoinflipCreateTransactionTool),
	);

	registerAppTool(
		server,
		'build_pvp_coinflip_join_transaction',
		{
			title: 'Build PvP Coinflip Join',
			description:
				'Build, dry-run, or inspect an unsigned Suigar PvP coinflip join transaction.',
			inputSchema: pvpCoinflipJoinInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildPvpCoinflipJoinTransactionTool),
	);

	registerAppTool(
		server,
		'build_pvp_coinflip_cancel_transaction',
		{
			title: 'Build PvP Coinflip Cancel',
			description:
				'Build, dry-run, or inspect an unsigned Suigar PvP coinflip cancel transaction.',
			inputSchema: pvpCoinflipCancelInputSchema,
			outputSchema: toolOutputSchema,
			annotations: {
				readOnlyHint: false,
				destructiveHint: false,
				idempotentHint: false,
				openWorldHint: true,
			},
			_meta: appToolMeta,
		},
		withToolErrors(buildPvpCoinflipCancelTransactionTool),
	);

	return server;
};

export const startSuigarMcpServer = async () => {
	const server = createSuigarMcpServer();
	const transport = new StdioServerTransport();
	await server.connect(transport);
};
