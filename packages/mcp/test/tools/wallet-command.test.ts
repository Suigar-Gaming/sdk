// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	spawn:
		vi.fn<
			(
				command: string,
				args: Array<string>,
				options: Record<string, unknown>,
			) => { pid: number; on: () => void; unref: () => void }
		>(),
	on: vi.fn<() => void>(),
	unref: vi.fn<() => void>(),
}));

vi.mock('node:child_process', () => ({
	spawn: mocks.spawn,
}));

vi.mock('../../src/runtime/index.js', () => ({
	createSuigarClient: (input: { network?: 'mainnet' | 'testnet' }) => ({
		config: { network: input.network ?? 'testnet' },
	}),
}));

vi.mock('../../src/wallet/index.js', () => ({
	createSessionWalletSetup: vi.fn<() => void>(),
	getExecutionStatus: vi.fn<() => void>(),
	listSessionWallets: vi.fn<() => void>(),
	loadCredentials: vi.fn<() => void>(),
	loadSessionWallet: vi.fn<() => void>(),
	resolveWebOrigin: () => 'https://mcp.testnet.suigar.com',
}));

const { suigarLoginTool, suigarLogoutTool } =
	await import('../../src/tools/handlers/wallet.js');

describe('wallet command tools', () => {
	it('starts the CLI login flow with npx for the selected network', async () => {
		mocks.spawn.mockReturnValue({
			pid: 1234,
			on: mocks.on,
			unref: mocks.unref,
		});

		const result = await suigarLoginTool({ network: 'mainnet' });
		const content = result.structuredContent as unknown as {
			connection: { command: string; pid: number; status: string };
		};

		expect(mocks.spawn).toHaveBeenCalledWith(
			'npx',
			['-y', '@suigar/mcp', 'login', '--network', 'mainnet'],
			expect.objectContaining({ detached: true, stdio: 'ignore' }),
		);
		expect(mocks.on).toHaveBeenCalledWith('error', expect.any(Function));
		expect(mocks.unref).toHaveBeenCalled();
		expect(content.connection).toMatchObject({
			command: 'npx -y @suigar/mcp login --network mainnet',
			pid: 1234,
			status: 'pending',
		});
	});

	it('starts the CLI logout flow with npx for the selected network', async () => {
		mocks.spawn.mockReturnValue({
			pid: 5678,
			on: mocks.on,
			unref: mocks.unref,
		});

		const result = await suigarLogoutTool({ network: 'testnet' });
		const content = result.structuredContent as unknown as {
			connection: { command: string; pid: number; status: string };
		};

		expect(mocks.spawn).toHaveBeenCalledWith(
			'npx',
			['-y', '@suigar/mcp', 'logout', '--network', 'testnet'],
			expect.objectContaining({ detached: true, stdio: 'ignore' }),
		);
		expect(content.connection).toMatchObject({
			command: 'npx -y @suigar/mcp logout --network testnet',
			pid: 5678,
			status: 'pending',
		});
	});
});
