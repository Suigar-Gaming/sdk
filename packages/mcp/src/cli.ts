// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import open from 'open';
import type { ArgumentsCamelCase, Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { SUPPORTED_SUI_NETWORKS, type SuigarNetwork } from '@suigar/sdk';
import { startSuigarMcpServer } from './server/index.js';
import {
	clearCredentials,
	createLoginBridge,
	createLogoutBridge,
	loadCredentials,
	resolveWebOrigin,
	setDefaultNetwork,
} from './wallet/index.js';

type NetworkArgs = ArgumentsCamelCase<{ network?: SuigarNetwork }>;
type JsonArgs = ArgumentsCamelCase<{ json: boolean }>;
const JSON_OPTION = {
	type: 'boolean' as const,
	default: false,
	description: 'Output machine-readable JSON instead of human-readable text',
};

const TOOL_CATALOG = [
	'setup_session_wallet',
	'get_session_wallet',
	'suigar_login',
	'suigar_logout',
	'get_connection_status',
	'get_execution_status',
	'read_config',
	'read_game_metadata',
	'list_nfts',
	'get_wallet_balances',
	'list_wallet_coins',
	'get_referral_commission',
	'get_referral_level_up_usd_rewards',
	'build_referral_commission_claim_transaction',
	'build_referral_level_up_usd_rewards_claim_transaction',
	'build_nft_v1_mint_transaction',
	'build_coinflip_transaction',
	'build_limbo_transaction',
	'build_plinko_transaction',
	'build_wheel_transaction',
	'build_range_transaction',
	'build_soccer_transaction',
	'build_pvp_coinflip_create_transaction',
	'build_pvp_coinflip_join_transaction',
	'build_pvp_coinflip_cancel_transaction',
] as const;

export async function runSuigarCli(argv = hideBin(process.argv)) {
	const parser = yargs(argv)
		.scriptName('')
		.strict()
		.help()
		.version()
		.command(
			'login',
			'Connect a wallet in the Suigar browser app',
			(command: Argv) =>
				command
					.option('network', {
						choices: SUPPORTED_SUI_NETWORKS,
						default: 'testnet',
					})
					.option('no-open', {
						type: 'boolean',
						default: false,
						description:
							'Do not open the connection page in the default browser; print its URL instead',
					})
					.option('json', JSON_OPTION),
			async (
				args: ArgumentsCamelCase<{
					network: SuigarNetwork;
					noOpen: boolean;
					json: boolean;
				}>,
			) => {
				const network = args.network;
				const bridge = await createLoginBridge({
					network,
					webOrigin: resolveWebOrigin(network),
				});
				process.stderr.write(
					`Open this URL to connect your wallet:\n${bridge.url}\n`,
				);
				if (!args.noOpen) await open(bridge.url).catch(() => undefined);
				const profile = await bridge.done;
				const result = {
					network,
					address: profile.address,
					walletType: profile.walletType,
				};
				process.stdout.write(
					args.json
						? `${JSON.stringify(result)}\n`
						: `Suigar MCP connected\n\nNetwork: ${network}\nWallet: ${profile.address} (${profile.walletType})\n`,
				);
			},
		)
		.command(
			'logout',
			'Disconnect a wallet through the Suigar browser app',
			(command: Argv) =>
				command
					.option('network', { choices: SUPPORTED_SUI_NETWORKS })
					.option('all', {
						type: 'boolean',
						default: false,
						description: 'Disconnect wallets on every network',
					})
					.option('no-open', {
						type: 'boolean',
						default: false,
						description:
							'Do not open the connection page in the default browser; print its URL instead',
					})
					.option('json', JSON_OPTION),
			async (
				args: NetworkArgs &
					JsonArgs &
					ArgumentsCamelCase<{
						all: boolean;
						noOpen: boolean;
					}>,
			) => {
				const credentials = await loadCredentials();
				const network = args.all
					? undefined
					: (args.network ?? credentials.defaultNetwork);
				const bridge = await createLogoutBridge({
					network,
					all: args.all,
					webOrigin: resolveWebOrigin(network ?? credentials.defaultNetwork),
				});
				process.stderr.write(
					`Open this URL to disconnect your wallet:\n${bridge.url}\n`,
				);
				if (!args.noOpen) await open(bridge.url).catch(() => undefined);
				await bridge.done;
				process.stdout.write(
					args.json
						? `${JSON.stringify({ network, all: args.all, loggedOut: true })}\n`
						: args.all
							? 'Logged out of every Suigar MCP wallet.\n'
							: `Logged out of Suigar MCP on ${network}.\n`,
				);
			},
		)
		.command(
			'clean',
			'Remove all local Suigar MCP credentials',
			(command: Argv) => command.option('json', JSON_OPTION),
			async (args: JsonArgs) => {
				await clearCredentials();
				process.stdout.write(
					args.json
						? `${JSON.stringify({ cleaned: true })}\n`
						: 'Removed all local Suigar MCP credentials.\n',
				);
			},
		)
		.command(
			'status',
			'Show non-secret MCP connection status',
			(command: Argv) =>
				command
					.option('network', { choices: SUPPORTED_SUI_NETWORKS })
					.option('json', JSON_OPTION),
			async (args: NetworkArgs & JsonArgs) => {
				const credentials = await loadCredentials();
				const network = args.network ?? credentials.defaultNetwork;
				const profile = credentials.profiles[network];
				const result = {
					network,
					connected: Boolean(profile),
					address: profile?.address,
					walletType: profile?.walletType,
					defaultNetwork: credentials.defaultNetwork,
				};
				process.stdout.write(
					args.json
						? `${JSON.stringify(result)}\n`
						: `Suigar MCP status\n\nNetwork: ${network}\nWallet: ${profile ? `${profile.address} (${profile.walletType})` : 'Not connected'}\nDefault network: ${credentials.defaultNetwork}\n`,
				);
			},
		)
		.command(
			'tools',
			'Print the MCP tool catalog',
			(command: Argv) => command.option('json', JSON_OPTION),
			async (args: JsonArgs) => {
				process.stdout.write(
					args.json
						? `${JSON.stringify({ tools: TOOL_CATALOG })}\n`
						: `Suigar MCP tools\n\n${TOOL_CATALOG.map((tool) => `- ${tool}`).join('\n')}\n`,
				);
			},
		)
		.command(
			'$0',
			'Start the stdio MCP server',
			(command: Argv) =>
				command.option('network', { choices: SUPPORTED_SUI_NETWORKS }),
			async (args: NetworkArgs) => {
				if (args.network) await setDefaultNetwork(args.network);
				await startSuigarMcpServer();
			},
		);
	await parser.parseAsync();
}
