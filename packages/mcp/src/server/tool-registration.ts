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
	buildReferralCommissionClaimTransactionInputSchema,
	buildReferralCommissionClaimTransactionTool,
	buildReferralLevelUpUsdRewardsClaimTransactionInputSchema,
	buildReferralLevelUpUsdRewardsClaimTransactionTool,
	buildSoccerTransactionTool,
	buildWheelTransactionTool,
	coinflipInputSchema,
	configIdInputSchema,
	connectionInputSchema,
	getConnectionStatusTool,
	getExecutionStatusInputSchema,
	getExecutionStatusTool,
	getReferralCommissionInputSchema,
	getReferralCommissionTool,
	getReferralLevelUpUsdRewardsInputSchema,
	getReferralLevelUpUsdRewardsTool,
	getWalletBalancesInputSchema,
	getWalletBalancesTool,
	limboInputSchema,
	listNftsInputSchema,
	listNftsTool,
	listWalletCoinsInputSchema,
	listWalletCoinsTool,
	pvpCoinflipCancelInputSchema,
	pvpCoinflipCreateInputSchema,
	pvpCoinflipJoinInputSchema,
	rangeInputSchema,
	readConfigInputSchema,
	readConfigTool,
	readGameMetadataInputSchema,
	readGameMetadataTool,
	soccerInputSchema,
	suigarLoginTool,
	suigarLogoutTool,
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
						text: `${errorText(error)}\n\nCheck required fields, network, coin type, and SDK config overrides.`,
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
		name: 'suigar_login',
		title: 'Login to Suigar',
		description: 'Open a secure browser wallet pairing flow.',
		inputSchema: connectionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: suigarLoginTool,
	},
	{
		name: 'suigar_logout',
		title: 'Logout of Suigar',
		description: 'Forget the paired wallet for the selected network.',
		inputSchema: connectionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: suigarLogoutTool,
	},
	{
		name: 'get_connection_status',
		title: 'Get Suigar Connection Status',
		description: 'Read wallet connection status without exposing secrets.',
		inputSchema: connectionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getConnectionStatusTool,
	},
	{
		name: 'get_execution_status',
		title: 'Get Execution Status',
		description:
			'Check the browser approval status for an execute-mode transaction.',
		inputSchema: getExecutionStatusInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getExecutionStatusTool,
	},
	{
		name: 'get_wallet_balances',
		title: 'Get Wallet Balances',
		description:
			'List aggregate balances for the connected wallet or an explicit address.',
		inputSchema: getWalletBalancesInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getWalletBalancesTool,
	},
	{
		name: 'list_wallet_coins',
		title: 'List Wallet Coins',
		description:
			'List paginated individual coin objects for the connected wallet or an explicit address.',
		inputSchema: listWalletCoinsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: listWalletCoinsTool,
	},
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
		name: 'list_nfts',
		title: 'List Suigar NFTs',
		description:
			'List the Suigar NFT catalog and the matching NFTs owned by one address.',
		inputSchema: listNftsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: listNftsTool,
	},
	{
		name: 'get_referral_commission',
		title: 'Get Referral Commission',
		description:
			'Simulate the commission a referrer can claim for one configured coin type.',
		inputSchema: getReferralCommissionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getReferralCommissionTool,
	},
	{
		name: 'get_referral_level_up_usd_rewards',
		title: 'Get Referral Level-up USD Rewards',
		description: 'Simulate the USD level-up rewards a referrer can claim.',
		inputSchema: getReferralLevelUpUsdRewardsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getReferralLevelUpUsdRewardsTool,
	},
	{
		name: 'build_referral_commission_claim_transaction',
		title: 'Build Referral Commission Claim',
		description:
			'Build, dry-run, or inspect an unsigned referral commission claim transaction.',
		inputSchema: buildReferralCommissionClaimTransactionInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildReferralCommissionClaimTransactionTool,
	},
	{
		name: 'build_referral_level_up_usd_rewards_claim_transaction',
		title: 'Build Referral Level-up USD Rewards Claim',
		description:
			'Build, dry-run, or inspect an unsigned referral level-up USD rewards claim transaction.',
		inputSchema: buildReferralLevelUpUsdRewardsClaimTransactionInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildReferralLevelUpUsdRewardsClaimTransactionTool,
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
		name: 'build_soccer_transaction',
		title: 'Build Soccer Transaction',
		description:
			'Build, dry-run, or inspect an unsigned Suigar Soccer transaction.',
		inputSchema: soccerInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildSoccerTransactionTool,
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
] satisfies Array<ToolDefinition>;

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
