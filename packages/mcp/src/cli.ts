// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import open from 'open';
import type { ArgumentsCamelCase, Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { startSuigarMcpServer } from './server/index.js';
import {
	createLoginBridge,
	loadCredentials,
	removeProfile,
	setDefaultNetwork,
} from './wallet/index.js';

const defaultOrigin = (network: 'mainnet' | 'testnet') =>
	network === 'mainnet' ? 'https://suigar.com' : 'https://testnet.suigar.com';
type NetworkArgs = ArgumentsCamelCase<{ network?: 'mainnet' | 'testnet' }>;
type JsonArgs = ArgumentsCamelCase<{ json?: boolean }>;

const TOOL_CATALOG = [
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
		.scriptName('suigar')
		.strict()
		.help()
		.version(false)
		.command(
			'login',
			'Connect a wallet in the Suigar browser app',
			(command: Argv) =>
				command
					.option('network', {
						choices: ['mainnet', 'testnet'] as const,
						default: 'testnet',
					})
					.option('web-url', { type: 'string' })
					.option('no-open', { type: 'boolean', default: false })
					.option('json', { type: 'boolean', default: false }),
			async (
				args: ArgumentsCamelCase<{
					network: 'mainnet' | 'testnet';
					webUrl?: string;
					noOpen: boolean;
					json: boolean;
				}>,
			) => {
				const network = args.network;
				const bridge = await createLoginBridge({
					network,
					frontendOrigin: args.webUrl ?? defaultOrigin(network),
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
			'Forget the wallet connected to a network',
			(command: Argv) =>
				command
					.option('network', { choices: ['mainnet', 'testnet'] as const })
					.option('json', { type: 'boolean', default: false }),
			async (args: NetworkArgs & JsonArgs) => {
				const credentials = await loadCredentials();
				const network = args.network ?? credentials.defaultNetwork;
				await removeProfile(network);
				const result = { network, loggedOut: true };
				process.stdout.write(
					args.json
						? `${JSON.stringify(result)}\n`
						: `Logged out of Suigar MCP on ${network}.\n`,
				);
			},
		)
		.command(
			'status',
			'Show non-secret MCP connection status',
			(command: Argv) =>
				command
					.option('network', { choices: ['mainnet', 'testnet'] as const })
					.option('json', { type: 'boolean', default: false }),
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
			(command: Argv) =>
				command.option('json', { type: 'boolean', default: false }),
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
				command.option('network', { choices: ['mainnet', 'testnet'] as const }),
			async (args: NetworkArgs) => {
				if (args.network) await setDefaultNetwork(args.network);
				await startSuigarMcpServer();
			},
		);
	await parser.parseAsync();
}
