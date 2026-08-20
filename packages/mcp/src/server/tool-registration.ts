// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { registerAppTool, type ToolConfig } from '@modelcontextprotocol/ext-apps/server';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import type { ToolTextResult } from '../runtime/index.js';
import {
	buildCoinflipTransactionTool,
	buildKenoTransactionTool,
	buildLimboTransactionTool,
	buildNftV1MintTransactionInputSchema,
	buildNftV1MintTransactionTool,
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
	fundSessionWalletTool,
	getConnectionStatusTool,
	getExecutionStatusInputSchema,
	getExecutionStatusTool,
	getReferralCommissionInputSchema,
	getReferralCommissionTool,
	getReferralLevelUpUsdRewardsInputSchema,
	getReferralLevelUpUsdRewardsTool,
	getSessionWalletTool,
	getWalletBalancesInputSchema,
	getWalletBalancesTool,
	kenoInputSchema,
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
	sessionWalletInputSchema,
	setupSessionWalletTool,
	soccerInputSchema,
	suigarLoginTool,
	suigarLogoutTool,
	toolOutputSchema,
} from '../tools/index.js';

function errorText(error: unknown): string {
	if (error instanceof Error) {
		return `${error.name}: ${error.message}`;
	}
	return String(error);
}

type ToolErrorResult = {
	isError: true;
	content: [{ type: 'text'; text: string }];
	structuredContent: {
		errors: Array<string>;
	};
};

export function withToolErrors<TInput>(
	handler: (input: TInput) => Promise<ToolTextResult>,
): (input: TInput) => Promise<ToolTextResult | ToolErrorResult> {
	return async (input: TInput): Promise<ToolTextResult | ToolErrorResult> => {
		try {
			return await handler(input);
		} catch (error) {
			const message = errorText(error);
			const guidance = 'Check required fields, network, coin type, and SDK config overrides.';
			return {
				isError: true,
				content: [
					{
						type: 'text',
						text: `${message}\n\n${guidance}`,
					},
				],
				structuredContent: { errors: [message, guidance] },
			};
		}
	};
}

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
	isAppTool: boolean;
};

type AppToolMeta = {
	readonly ui: {
		readonly resourceUri: string;
	};
};

const toolDefinitions = [
	{
		name: 'setup_session_wallet',
		title: 'Set Up Session Wallet',
		description:
			'Open a local, user-only setup page to create or recover a persistent session wallet. Recovery phrases never pass through MCP.',
		inputSchema: sessionWalletInputSchema,
		annotations: transactionToolAnnotations,
		handler: setupSessionWalletTool,
		isAppTool: false,
	},
	{
		name: 'fund_session_wallet',
		title: 'Fund Session Wallet',
		description:
			'Open a prefilled browser transfer form to fund the local session wallet from the paired wallet.',
		inputSchema: sessionWalletInputSchema,
		annotations: transactionToolAnnotations,
		handler: fundSessionWalletTool,
		isAppTool: false,
	},
	{
		name: 'get_session_wallet',
		title: 'Get Session Wallet',
		description:
			'Read the persistent local session wallet address, balances, and a wallet-funding QR code without exposing its private key.',
		inputSchema: sessionWalletInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getSessionWalletTool,
		isAppTool: true,
	},
	{
		name: 'suigar_login',
		title: 'Login to Suigar',
		description: 'Open a secure browser wallet pairing flow.',
		inputSchema: connectionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: suigarLoginTool,
		isAppTool: false,
	},
	{
		name: 'suigar_logout',
		title: 'Logout of Suigar',
		description: 'Forget the paired wallet for the selected network.',
		inputSchema: connectionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: suigarLogoutTool,
		isAppTool: false,
	},
	{
		name: 'get_connection_status',
		title: 'Get Suigar Connection Status',
		description: 'Read wallet connection status without exposing secrets.',
		inputSchema: connectionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getConnectionStatusTool,
		isAppTool: false,
	},
	{
		name: 'get_execution_status',
		title: 'Get Execution Status',
		description: 'Check the browser approval status for an execute-mode transaction.',
		inputSchema: getExecutionStatusInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getExecutionStatusTool,
		isAppTool: true,
	},
	{
		name: 'get_wallet_balances',
		title: 'Get Wallet Balances',
		description: 'List aggregate balances for the connected wallet or an explicit address.',
		inputSchema: getWalletBalancesInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getWalletBalancesTool,
		isAppTool: true,
	},
	{
		name: 'list_wallet_coins',
		title: 'List Wallet Coins',
		description:
			'List paginated individual coin objects for the connected wallet or an explicit address.',
		inputSchema: listWalletCoinsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: listWalletCoinsTool,
		isAppTool: true,
	},
	{
		name: 'read_config',
		title: 'Read Suigar Config',
		description: 'Resolve Suigar SDK config for mainnet or testnet. Defaults to testnet.',
		inputSchema: readConfigInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: readConfigTool,
		isAppTool: true,
	},
	{
		name: 'read_game_metadata',
		title: 'Read Suigar Game Metadata',
		description: 'Read live on-chain parameters for one selected Suigar game and coin type.',
		inputSchema: readGameMetadataInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: readGameMetadataTool,
		isAppTool: true,
	},
	{
		name: 'list_nfts',
		title: 'List Suigar NFTs',
		description: 'List the Suigar NFT catalog and the matching NFTs owned by one address.',
		inputSchema: listNftsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: listNftsTool,
		isAppTool: true,
	},
	{
		name: 'get_referral_commission',
		title: 'Get Referral Commission',
		description: 'Simulate the commission a referrer can claim for one configured coin type.',
		inputSchema: getReferralCommissionInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getReferralCommissionTool,
		isAppTool: true,
	},
	{
		name: 'get_referral_level_up_usd_rewards',
		title: 'Get Referral Level-up USD Rewards',
		description: 'Simulate the USD level-up rewards a referrer can claim.',
		inputSchema: getReferralLevelUpUsdRewardsInputSchema,
		annotations: readOnlyToolAnnotations,
		handler: getReferralLevelUpUsdRewardsTool,
		isAppTool: true,
	},
	{
		name: 'build_referral_commission_claim_transaction',
		title: 'Build Referral Commission Claim',
		description: 'Build, dry-run, or inspect an unsigned referral commission claim transaction.',
		inputSchema: buildReferralCommissionClaimTransactionInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildReferralCommissionClaimTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_referral_level_up_usd_rewards_claim_transaction',
		title: 'Build Referral Level-up USD Rewards Claim',
		description:
			'Build, dry-run, or inspect an unsigned referral level-up USD rewards claim transaction.',
		inputSchema: buildReferralLevelUpUsdRewardsClaimTransactionInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildReferralLevelUpUsdRewardsClaimTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_nft_v1_mint_transaction',
		title: 'Build NFT V1 Mint Transaction',
		description: 'Build, dry-run, or inspect an unsigned NFT V1 mint transaction.',
		inputSchema: buildNftV1MintTransactionInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildNftV1MintTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_coinflip_transaction',
		title: 'Build Coinflip Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar coinflip transaction.',
		inputSchema: coinflipInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildCoinflipTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_limbo_transaction',
		title: 'Build Limbo Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar limbo transaction.',
		inputSchema: limboInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildLimboTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_keno_transaction',
		title: 'Build Keno Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar Keno transaction.',
		inputSchema: kenoInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildKenoTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_plinko_transaction',
		title: 'Build Plinko Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar plinko transaction.',
		inputSchema: configIdInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPlinkoTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_wheel_transaction',
		title: 'Build Wheel Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar wheel transaction.',
		inputSchema: configIdInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildWheelTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_range_transaction',
		title: 'Build Range Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar range transaction.',
		inputSchema: rangeInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildRangeTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_soccer_transaction',
		title: 'Build Soccer Transaction',
		description: 'Build, dry-run, or inspect an unsigned Suigar Soccer transaction.',
		inputSchema: soccerInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildSoccerTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_pvp_coinflip_create_transaction',
		title: 'Build PvP Coinflip Create',
		description:
			'Build, dry-run, or inspect an unsigned Suigar PvP coinflip lobby creation transaction.',
		inputSchema: pvpCoinflipCreateInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPvpCoinflipCreateTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_pvp_coinflip_join_transaction',
		title: 'Build PvP Coinflip Join',
		description: 'Build, dry-run, or inspect an unsigned Suigar PvP coinflip join transaction.',
		inputSchema: pvpCoinflipJoinInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPvpCoinflipJoinTransactionTool,
		isAppTool: true,
	},
	{
		name: 'build_pvp_coinflip_cancel_transaction',
		title: 'Build PvP Coinflip Cancel',
		description: 'Build, dry-run, or inspect an unsigned Suigar PvP coinflip cancel transaction.',
		inputSchema: pvpCoinflipCancelInputSchema,
		annotations: transactionToolAnnotations,
		handler: buildPvpCoinflipCancelTransactionTool,
		isAppTool: true,
	},
] satisfies Array<ToolDefinition>;

const registerTool = (server: McpServer, appToolMeta: AppToolMeta, tool: ToolDefinition) => {
	const config = {
		title: tool.title,
		description: tool.description,
		inputSchema: tool.inputSchema,
		annotations: tool.annotations,
		outputSchema: toolOutputSchema,
	};
	const handler = withToolErrors(tool.handler);

	if (tool.isAppTool) {
		registerAppTool(server, tool.name, { ...config, _meta: appToolMeta }, handler);
		return;
	}

	server.registerTool(tool.name, config, handler);
};

export function registerSuigarTools(server: McpServer, appToolMeta: AppToolMeta): void {
	for (const tool of toolDefinitions) {
		registerTool(server, appToolMeta, tool);
	}
}
