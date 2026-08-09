// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	createLoginBridge: vi.fn<
		() => Promise<{
			url: string;
			done: Promise<{ address: string; walletType: string }>;
		}>
	>(),
	createLogoutBridge: vi.fn<() => Promise<unknown>>(),
	loadCredentials: vi.fn<() => Promise<unknown>>(),
}));

vi.mock('../src/server/index.js', () => ({
	startSuigarMcpServer: vi.fn<() => void>(),
}));

vi.mock('../src/wallet/index.js', () => ({
	BRIDGE_TIMEOUT_ENV: 'SUIGAR_MCP_BRIDGE_TIMEOUT_MS',
	clearCredentials: vi.fn<() => void>(),
	createLoginBridge: mocks.createLoginBridge,
	createLogoutBridge: mocks.createLogoutBridge,
	DEFAULT_MAX_BODY_BYTES: 16 * 1024,
	DEFAULT_TIMEOUT_MS: 5 * 60_000,
	loadCredentials: mocks.loadCredentials,
	MAX_BODY_BYTES_ENV: 'SUIGAR_MCP_BRIDGE_MAX_BODY_BYTES',
	resolveWebOrigin: (network: 'mainnet' | 'testnet', webUrl?: string) =>
		webUrl ??
		(network === 'mainnet'
			? 'https://mcp.suigar.com'
			: 'https://mcp.testnet.suigar.com'),
	setDefaultNetwork: vi.fn<() => void>(),
	WEB_URL_ENV: 'SUIGAR_MCP_WEB_URL',
}));

const { runSuigarCli } = await import('../src/cli.js');

describe('suigar cli bridge options', () => {
	it('passes bridge timeout, body size, and open flags to login bridges', async () => {
		mocks.createLoginBridge.mockResolvedValue({
			url: 'https://mcp.testnet.suigar.com/connection',
			done: Promise.resolve({
				address: '0x1',
				walletType: 'wallet',
			}),
		});
		const stdout = vi
			.spyOn(process.stdout, 'write')
			.mockImplementation(() => true);
		const stderr = vi
			.spyOn(process.stderr, 'write')
			.mockImplementation(() => true);

		try {
			await runSuigarCli([
				'login',
				'--network',
				'mainnet',
				'--timeout-ms',
				'1000',
				'--max-body-bytes',
				'2048',
				'--web-url',
				'http://localhost:5173',
				'--no-open',
				'--json',
			]);
		} finally {
			stdout.mockRestore();
			stderr.mockRestore();
		}

		expect(mocks.createLoginBridge).toHaveBeenCalledWith({
			network: 'mainnet',
			webOrigin: 'http://localhost:5173',
			timeoutMs: 1000,
			maxBodyBytes: 2048,
			open: false,
		});
	});
});
