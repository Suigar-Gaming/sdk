// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	loadCredentials: vi.fn(),
	loadSessionWallet: vi.fn(),
}));

vi.mock('../../src/runtime/index.js', () => ({
	createSuigarClient: () => ({ config: { network: 'testnet' } }),
}));

vi.mock('../../src/wallet/index.js', () => ({
	loadCredentials: mocks.loadCredentials,
	loadSessionWallet: mocks.loadSessionWallet,
	resolveWebOrigin: () => 'https://mcp.testnet.suigar.com',
}));

const { fundSessionWalletTool } =
	await import('../../src/tools/handlers/wallet.js');

const connectedAddress =
	'0x0000000000000000000000000000000000000000000000000000000000000001';
const sessionAddress =
	'0x0000000000000000000000000000000000000000000000000000000000000002';

describe('fund_session_wallet', () => {
	it('returns a prefilled funding URL only when both wallets exist', async () => {
		mocks.loadCredentials.mockResolvedValue({
			profiles: { testnet: { address: connectedAddress } },
		});
		mocks.loadSessionWallet.mockResolvedValue({ address: sessionAddress });

		const result = await fundSessionWalletTool({ network: 'testnet' });
		const content = result.structuredContent as unknown as {
			sessionWallet: { fundingUrl: string };
		};
		const url = new URL(content.sessionWallet.fundingUrl);

		expect(url.pathname).toBe('/fund-session-wallet');
		expect(url.searchParams.get('destination')).toBe(sessionAddress);
		expect(url.searchParams.get('owner')).toBe(connectedAddress);
		expect(url.searchParams.get('network')).toBe('testnet');
	});

	it('requires a paired wallet', async () => {
		mocks.loadCredentials.mockResolvedValue({ profiles: {} });
		mocks.loadSessionWallet.mockResolvedValue({ address: sessionAddress });

		await expect(fundSessionWalletTool({ network: 'testnet' })).rejects.toThrow(
			'Call suigar_login first',
		);
	});
});
