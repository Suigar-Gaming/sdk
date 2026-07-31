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
					.option('no-open', { type: 'boolean', default: false }),
			async (
				args: ArgumentsCamelCase<{
					network: 'mainnet' | 'testnet';
					webUrl?: string;
					noOpen: boolean;
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
				process.stdout.write(
					`${JSON.stringify({ network, address: profile.address, walletType: profile.walletType })}\n`,
				);
			},
		)
		.command(
			'logout',
			'Forget the wallet connected to a network',
			(command: Argv) =>
				command.option('network', { choices: ['mainnet', 'testnet'] as const }),
			async (args: NetworkArgs) => {
				const credentials = await loadCredentials();
				const network = args.network ?? credentials.defaultNetwork;
				await removeProfile(network);
				process.stdout.write(
					`${JSON.stringify({ network, loggedOut: true })}\n`,
				);
			},
		)
		.command(
			'status',
			'Show non-secret MCP connection status',
			(command: Argv) =>
				command.option('network', { choices: ['mainnet', 'testnet'] as const }),
			async (args: NetworkArgs) => {
				const credentials = await loadCredentials();
				const network = args.network ?? credentials.defaultNetwork;
				const profile = credentials.profiles[network];
				process.stdout.write(
					`${JSON.stringify({ network, connected: Boolean(profile), address: profile?.address, walletType: profile?.walletType, defaultNetwork: credentials.defaultNetwork })}\n`,
				);
			},
		)
		.command(
			'tools',
			'Print the MCP tool catalog',
			() => {},
			async () => {
				process.stdout.write(
					`${JSON.stringify({ tools: ['suigar_login', 'suigar_logout', 'get_connection_status', 'get_execution_status', 'read_config', 'read_game_metadata', 'list_nfts', 'get_wallet_balances', 'list_wallet_coins', 'get_referral_commission', 'get_referral_level_up_usd_rewards', 'build_referral_commission_claim_transaction', 'build_referral_level_up_usd_rewards_claim_transaction', 'build_coinflip_transaction', 'build_limbo_transaction', 'build_plinko_transaction', 'build_wheel_transaction', 'build_range_transaction', 'build_soccer_transaction', 'build_pvp_coinflip_create_transaction', 'build_pvp_coinflip_join_transaction', 'build_pvp_coinflip_cancel_transaction'] })}\n`,
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
