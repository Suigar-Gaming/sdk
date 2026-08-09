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
	clearCredentials: vi.fn<() => void>(),
	createLoginBridge: mocks.createLoginBridge,
	createLogoutBridge: mocks.createLogoutBridge,
	loadCredentials: mocks.loadCredentials,
	resolveWebOrigin: (network: 'mainnet' | 'testnet') =>
		network === 'mainnet'
			? 'https://mcp.suigar.com'
			: 'https://mcp.testnet.suigar.com',
	setDefaultNetwork: vi.fn<() => void>(),
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
				'--bridge-timeout-ms',
				'1000',
				'--max-body-bytes',
				'2048',
				'--no-open',
				'--json',
			]);
		} finally {
			stdout.mockRestore();
			stderr.mockRestore();
		}

		expect(mocks.createLoginBridge).toHaveBeenCalledWith({
			network: 'mainnet',
			webOrigin: 'https://mcp.suigar.com',
			timeoutMs: 1000,
			maxBodyBytes: 2048,
			open: false,
		});
	});
});
