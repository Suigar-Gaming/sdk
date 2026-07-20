// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	registerAppTool,
	type ToolConfig,
} from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ToolTextResult } from '../runtime/index.js';
import {
	buildCoinflipTransactionTool,
	buildLimboTransactionTool,
	buildPlinkoTransactionTool,
	buildPvpCoinflipCancelTransactionTool,
	buildPvpCoinflipCreateTransactionTool,
	buildPvpCoinflipJoinTransactionTool,
	buildRangeTransactionTool,
	buildWheelTransactionTool,
	coinflipInputSchema,
	configIdInputSchema,
	limboInputSchema,
	listLegacyNftsInputSchema,
	listLegacyNftsTool,
	pvpCoinflipCancelInputSchema,
	pvpCoinflipCreateInputSchema,
	pvpCoinflipJoinInputSchema,
	rangeInputSchema,
	readConfigInputSchema,
	readConfigTool,
	readGameMetadataInputSchema,
	readGameMetadataTool,
	toolOutputSchema,
} from '../tools/index.js';

const errorText = (error: unknown) => {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
};

export const withToolErrors =
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

export const readOnlyToolAnnotations = {
	readOnlyHint: true,
	destructiveHint: false,
	idempotentHint: true,
	openWorldHint: false,
} satisfies ToolAnnotations;

const transactionToolAnnotations = {
	readOnlyHint: false,
	destructiveHint: false,
	idempotentHint: false,
	openWorldHint: true,
} satisfies ToolAnnotations;

type ToolHandler<TInput = never> = Parameters<typeof withToolErrors<TInput>>[0];

type ToolDefinition = {
	name: string;
	title: string;
	description: string;
	inputSchema: NonNullable<ToolConfig['inputSchema']>;
	annotations: ToolAnnotations;
	handler: ToolHandler;
};

type AppToolMeta = {
	readonly ui: {
		readonly resourceUri: string;
	};
};

const appTools = [
	{
		name: 'read_config',
		title: 'Read Suigar Config',
		description:
			'Resolve Suigar SDK config for mainnet or testnet. Defaults to testnet.',
		inputSchema: readConfigInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: readConfigTool,
	},
	{
		name: 'read_game_metadata',
		title: 'Read Suigar Game Metadata',
		description:
			'Read live on-chain parameters for one selected Suigar game and coin type without opening the MCP App.',
		inputSchema: readGameMetadataInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: readGameMetadataTool,
	},
	{
		name: 'list_legacy_nfts',
		title: 'List Legacy Suigar NFTs',
		description:
			'List the legacy Suigar NFT catalog and the matching NFTs owned by one address.',
		inputSchema: listLegacyNftsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: listLegacyNftsTool,
	},
	{
		name: 'build_coinflip_transaction',
		title: 'Build Coinflip Transaction',
		description:
			'Build, dry-run, or inspect an unsigned Suigar coinflip transaction.',
		inputSchema: coinflipInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildCoinflipTransactionTool,
	},
	{
		name: 'build_limbo_transaction',
		title: 'Build Limbo Transaction',
		description:
			'Build, dry-run, or inspect an unsigned Suigar limbo transaction.',
		inputSchema: limboInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildLimboTransactionTool,
	},
	{
		name: 'build_plinko_transaction',
		title: 'Build Plinko Transaction',
		description:
			'Build, dry-run, or inspect an unsigned Suigar plinko transaction.',
		inputSchema: configIdInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPlinkoTransactionTool,
	},
	{
		name: 'build_wheel_transaction',
		title: 'Build Wheel Transaction',
		description:
			'Build, dry-run, or inspect an unsigned Suigar wheel transaction.',
		inputSchema: configIdInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildWheelTransactionTool,
	},
	{
		name: 'build_range_transaction',
		title: 'Build Range Transaction',
		description:
			'Build, dry-run, or inspect an unsigned Suigar range transaction.',
		inputSchema: rangeInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildRangeTransactionTool,
	},
	{
		name: 'build_pvp_coinflip_create_transaction',
		title: 'Build PvP Coinflip Create',
		description:
			'Build, dry-run, or inspect an unsigned Suigar PvP coinflip lobby creation transaction.',
		inputSchema: pvpCoinflipCreateInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPvpCoinflipCreateTransactionTool,
	},
	{
		name: 'build_pvp_coinflip_join_transaction',
		title: 'Build PvP Coinflip Join',
		description:
			'Build, dry-run, or inspect an unsigned Suigar PvP coinflip join transaction.',
		inputSchema: pvpCoinflipJoinInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPvpCoinflipJoinTransactionTool,
	},
	{
		name: 'build_pvp_coinflip_cancel_transaction',
		title: 'Build PvP Coinflip Cancel',
		description:
			'Build, dry-run, or inspect an unsigned Suigar PvP coinflip cancel transaction.',
		inputSchema: pvpCoinflipCancelInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPvpCoinflipCancelTransactionTool,
	},
] satisfies ToolDefinition[];

const registerTool = <TInput>(
	server: McpServer,
	appToolMeta: AppToolMeta,
	tool: ToolDefinition & { handler: ToolHandler<TInput> },
) =>
	registerAppTool(
		server,
		tool.name,
		{
			title: tool.title,
			description: tool.description,
			inputSchema: tool.inputSchema,
			annotations: tool.annotations,
			outputSchema: toolOutputSchema,
			_meta: appToolMeta,
		},
		withToolErrors(tool.handler),
	);

export const registerSuigarTools = (
	server: McpServer,
	appToolMeta: AppToolMeta,
) => {
	for (const tool of appTools) {
		registerTool(server, appToolMeta, tool);
	}
};
