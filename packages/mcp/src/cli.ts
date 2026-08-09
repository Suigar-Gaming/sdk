// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ArgumentsCamelCase, Argv } from 'yargs';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { SUPPORTED_SUI_NETWORKS, type SuigarNetwork } from '@suigar/sdk';
import { startSuigarMcpServer } from './server/index.js';
import {
	BRIDGE_TIMEOUT_ENV,
	clearCredentials,
	createLoginBridge,
	createLogoutBridge,
	DEFAULT_MAX_BODY_BYTES,
	DEFAULT_TIMEOUT_MS,
	loadCredentials,
	MAX_BODY_BYTES_ENV,
	resolveWebOrigin,
	setDefaultNetwork,
	WEB_URL_ENV,
	type BridgeOptions,
} from './wallet/index.js';

type NetworkArgs = ArgumentsCamelCase<{ network?: SuigarNetwork }>;
type JsonArgs = ArgumentsCamelCase<{ json: boolean }>;
type BridgeArgs = ArgumentsCamelCase<{
	bridgeTimeoutMs?: number;
	bridgeMaxBodyBytes?: number;
	open: boolean;
	webUrl?: string;
}>;
const JSON_OPTION = {
	type: 'boolean' as const,
	default: false,
	description: 'Output machine-readable JSON instead of human-readable text',
};
const addBridgeOptions = (command: Argv): Argv =>
	command
		.option('bridge-timeout-ms', {
			type: 'number' as const,
			description: `Milliseconds before a local browser bridge expires; defaults to ${BRIDGE_TIMEOUT_ENV} or ${DEFAULT_TIMEOUT_MS}`,
		})
		.option('bridge-max-body-bytes', {
			type: 'number' as const,
			description: `Maximum JSON callback body size for the local browser bridge; defaults to ${MAX_BODY_BYTES_ENV} or ${DEFAULT_MAX_BODY_BYTES}`,
		})
		.option('web-url', {
			type: 'string' as const,
			description: `Browser app origin for wallet pairing and approval pages; defaults to ${WEB_URL_ENV} or the selected network origin`,
		})
		.option('open', {
			type: 'boolean' as const,
			default: true,
			description:
				'Open the connection page in the default browser; use --no-open to only print its URL',
		});
const getBridgeOptions = (args: BridgeArgs): BridgeOptions => ({
	timeoutMs: args.bridgeTimeoutMs,
	maxBodyBytes: args.bridgeMaxBodyBytes,
	open: args.open,
});

export async function runSuigarCli(argv = hideBin(process.argv)) {
	const parser = yargs(argv)
		.scriptName('')
		.strict()
		.help()
		.version()
		.command(
			'login',
			'Connect a wallet in the Suigar browser app',
			(command) =>
				addBridgeOptions(command)
					.option('network', {
						choices: SUPPORTED_SUI_NETWORKS,
						default: 'testnet',
					})
					.option('json', JSON_OPTION),
			async (args) => {
				const bridgeArgs = args as unknown as BridgeArgs;
				const network = args.network as SuigarNetwork;
				const bridge = await createLoginBridge({
					network,
					webOrigin: resolveWebOrigin(network, bridgeArgs.webUrl),
					...getBridgeOptions(bridgeArgs),
				});
				process.stderr.write(
					`Open this URL to connect your wallet:\n${bridge.url}\n`,
				);
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
			(command) =>
				addBridgeOptions(command)
					.option('network', { choices: SUPPORTED_SUI_NETWORKS })
					.option('all', {
						type: 'boolean',
						default: false,
						description: 'Disconnect wallets on every network',
					})
					.option('json', JSON_OPTION),
			async (args) => {
				const bridgeArgs = args as unknown as BridgeArgs;
				const credentials = await loadCredentials();
				const network = args.all
					? undefined
					: (args.network ?? credentials.defaultNetwork);
				const bridge = await createLogoutBridge({
					network,
					all: args.all,
					webOrigin: resolveWebOrigin(
						network ?? credentials.defaultNetwork,
						bridgeArgs.webUrl,
					),
					...getBridgeOptions(bridgeArgs),
				});
				process.stderr.write(
					`Open this URL to disconnect your wallet:\n${bridge.url}\n`,
				);
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
