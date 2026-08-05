// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	loadCredentials: vi.fn(),
	loadSessionWallet: vi.fn(),
}));

const sessionAddress =
	'0x0000000000000000000000000000000000000000000000000000000000000002';
const pairedAddress =
	'0x0000000000000000000000000000000000000000000000000000000000000001';

vi.mock('qrcode', () => ({
	default: { toDataURL: vi.fn(async () => 'data:image/png;base64,qr') },
}));

vi.mock('../../src/runtime/index.js', () => ({
	createSuigarClient: () => ({
		config: { network: 'testnet' },
		client: {
			core: {
				listBalances: vi.fn(async () => ({
					balances: [{ coinType: '0x2::sui::SUI', balance: '1200000000' }],
				})),
			},
		},
	}),
}));

vi.mock('../../src/wallet/index.js', () => ({
	loadCredentials: mocks.loadCredentials,
	loadSessionWallet: mocks.loadSessionWallet,
	resolveWebOrigin: () => 'https://mcp.testnet.suigar.com',
}));

vi.mock('../../src/tools/handlers/shared.js', () => ({
	asTextResponse: (structuredContent: unknown) => ({
		content: [{ type: 'text', text: JSON.stringify(structuredContent) }],
		structuredContent,
	}),
	getConfigInput: (input: unknown) => input,
	resolveCoinDisplayMetadata: async () => ({ decimals: 9, symbol: 'SUI' }),
}));

const { getSessionWalletTool } =
	await import('../../src/tools/handlers/wallet.js');

describe('get_session_wallet', () => {
	it('returns formatted balances and a paired-wallet funding URL', async () => {
		mocks.loadSessionWallet.mockResolvedValue({ address: sessionAddress });
		mocks.loadCredentials.mockResolvedValue({
			profiles: { testnet: { address: pairedAddress } },
		});

		const result = await getSessionWalletTool({ network: 'testnet' });
		const content = result.structuredContent as unknown as {
			sessionWallet: {
				balances: Array<{ balanceDisplay: string; symbol: string }>;
				funding: { fundingUrl?: string };
			};
		};
		const fundingUrl = new URL(content.sessionWallet.funding.fundingUrl!);

		expect(content.sessionWallet.balances).toEqual([
			expect.objectContaining({ balanceDisplay: '1.2', symbol: 'SUI' }),
		]);
		expect(fundingUrl.pathname).toBe('/fund-session-wallet');
		expect(fundingUrl.searchParams.get('destination')).toBe(sessionAddress);
		expect(fundingUrl.searchParams.get('owner')).toBe(pairedAddress);
	});

	it('explains how to enable funding when no wallet is paired', async () => {
		mocks.loadSessionWallet.mockResolvedValue({ address: sessionAddress });
		mocks.loadCredentials.mockResolvedValue({ profiles: {} });

		const result = await getSessionWalletTool({ network: 'testnet' });
		const content = result.structuredContent as unknown as {
			sessionWallet: { funding: { fundingUrl?: string; note: string } };
		};

		expect(content.sessionWallet.funding.fundingUrl).toBeUndefined();
		expect(content.sessionWallet.funding.note).toContain('suigar_login');
	});
});
