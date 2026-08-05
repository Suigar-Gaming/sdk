// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import QRCode from 'qrcode';
import {
	createSuigarClient,
	type ToolTextResult,
} from '../../runtime/index.js';
import { formatBaseUnitAmount } from '../../utils/index.js';
import {
	createLoginBridge,
	createSessionWalletSetup,
	getExecutionStatus,
	loadCredentials,
	loadSessionWallet,
	removeProfile,
	resolveWebOrigin,
} from '../../wallet/index.js';
import type {
	ConnectionInput,
	GetExecutionStatusInput,
	GetWalletBalancesInput,
	ListWalletCoinsInput,
	SessionWalletInput,
} from '../schemas/index.js';
import {
	asTextResponse,
	getConfigInput,
	resolveCoinDisplayMetadata,
	resolveWalletOwner,
} from './shared.js';

export const getWalletBalancesTool = async (
	input: GetWalletBalancesInput,
): Promise<ToolTextResult> => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveWalletOwner(input, bundle);
	const balances = [];
	let cursor: string | null = null;
	let hasNextPage = false;
	do {
		const result = await bundle.client.core.listBalances({ owner, cursor });
		balances.push(...result.balances);
		cursor = result.cursor;
		hasNextPage = result.hasNextPage;
	} while (hasNextPage && cursor);

	const metadata = new Map(
		await Promise.all(
			balances.map(
				async (balance) =>
					[
						balance.coinType,
						await resolveCoinDisplayMetadata(balance.coinType, bundle),
					] as const,
			),
		),
	);
	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		wallet: {
			owner,
			balances: balances.map((balance) => {
				const coin = metadata.get(balance.coinType)!;
				return {
					...balance,
					balanceDisplay: formatBaseUnitAmount(balance.balance, coin.decimals),
					symbol: coin.symbol,
				};
			}),
		},
	});
};

export const listWalletCoinsTool = async (
	input: ListWalletCoinsInput,
): Promise<ToolTextResult> => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveWalletOwner(input, bundle);

	const result = await bundle.client.core.listCoins({
		owner,
		coinType: input.coinType,
		cursor: input.cursor,
		limit: input.limit ?? 50,
	});
	const metadata = await resolveCoinDisplayMetadata(
		input.coinType ?? bundle.config.sdk.coins.sui.coinType,
		bundle,
	);
	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		wallet: {
			owner,
			coins: result.objects.map((coin) => {
				return {
					...coin,
					balanceDisplay: formatBaseUnitAmount(coin.balance, metadata.decimals),
					symbol: metadata.symbol,
				};
			}),
			nextCursor: result.cursor,
			hasNextPage: result.hasNextPage,
		},
	});
};

export const getExecutionStatusTool = async (
	input: GetExecutionStatusInput,
): Promise<ToolTextResult> => {
	const execution = getExecutionStatus(input.requestId);
	if (!execution)
		throw new Error(
			'Unknown execution request. It may have expired or this MCP server restarted.',
		);
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({ network: config.network, config, execution });
};

export const getConnectionStatusTool = async (
	input: ConnectionInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	const profile = (await loadCredentials()).profiles[config.network];
	return asTextResponse({
		network: config.network,
		config,
		connection: profile
			? {
					connected: true,
					address: profile.address,
					walletType: profile.walletType,
					status: 'connected',
				}
			: { connected: false, status: 'logged-out' },
	});
};

export const suigarLoginTool = async (
	input: ConnectionInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	const bridge = await createLoginBridge({
		network: config.network,
		webOrigin: resolveWebOrigin(config.network),
	});
	void bridge.done.catch(() => undefined);
	return asTextResponse({
		network: config.network,
		config,
		connection: { connected: false, loginUrl: bridge.url, status: 'pending' },
	});
};

export const suigarLogoutTool = async (
	input: ConnectionInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	await removeProfile(config.network);
	return asTextResponse({
		network: config.network,
		config,
		connection: { connected: false, status: 'logged-out' },
	});
};

export const setupSessionWalletTool = async (
	input: SessionWalletInput,
): Promise<ToolTextResult> => {
	const { config } = createSuigarClient(getConfigInput(input));
	const setup = await createSessionWalletSetup(config.network);
	return asTextResponse({
		network: config.network,
		config,
		sessionWallet: {
			status: 'setup-pending',
			setupUrl: setup.setupUrl,
			note: 'Open this local URL yourself. The recovery phrase is intentionally never returned through MCP.',
		},
	});
};

export const getSessionWalletTool = async (
	input: SessionWalletInput,
): Promise<ToolTextResult> => {
	const bundle = createSuigarClient(getConfigInput(input));
	const wallet = await loadSessionWallet(bundle.config.network);
	if (!wallet)
		throw new Error(
			'No session wallet exists. Call setup_session_wallet first.',
		);
	const result = await bundle.client.core.listBalances({
		owner: wallet.address,
	});
	const addressQrCodeDataUrl = await QRCode.toDataURL(wallet.address, {
		errorCorrectionLevel: 'M',
		margin: 1,
	});
	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		sessionWallet: {
			...wallet,
			balances: result.balances,
			funding: {
				address: wallet.address,
				addressQrCodeDataUrl,
				note: 'This QR code contains only the Sui address, making it suitable for wallet send flows. Approve the funding transfer in your wallet.',
			},
		},
	});
};
