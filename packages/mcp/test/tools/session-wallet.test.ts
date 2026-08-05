// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	loadCredentials: vi.fn(),
	loadSessionWallet: vi.fn(),
	createSessionWalletSetup: vi.fn(),
	listBalances: vi.fn(),
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
				listBalances: mocks.listBalances,
			},
		},
	}),
}));

vi.mock('../../src/wallet/index.js', () => ({
	loadCredentials: mocks.loadCredentials,
	loadSessionWallet: mocks.loadSessionWallet,
	createSessionWalletSetup: mocks.createSessionWalletSetup,
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
	beforeEach(() => {
		mocks.listBalances.mockReset();
		mocks.listBalances.mockResolvedValue({
			balances: [{ coinType: '0x2::sui::SUI', balance: '1200000000' }],
			cursor: null,
			hasNextPage: false,
		});
	});

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

	it('returns a setup view model when no wallet exists', async () => {
		mocks.loadSessionWallet.mockResolvedValue(null);
		mocks.loadCredentials.mockResolvedValue({ profiles: {} });
		mocks.createSessionWalletSetup.mockResolvedValue({
			setupUrl: 'http://127.0.0.1:12345/',
		});

		const result = await getSessionWalletTool({ network: 'testnet' });
		const content = result.structuredContent as unknown as {
			sessionWallet: { status: string; setupUrl: string };
		};

		expect(content.sessionWallet).toEqual({
			status: 'setup-required',
			setupUrl: 'http://127.0.0.1:12345/',
			note: expect.stringContaining('shared by mainnet and testnet'),
		});
	});

	it('loads every balance page', async () => {
		mocks.loadSessionWallet.mockResolvedValue({ address: sessionAddress });
		mocks.loadCredentials.mockResolvedValue({ profiles: {} });
		mocks.listBalances
			.mockResolvedValueOnce({
				balances: [{ coinType: '0x2::sui::SUI', balance: '1000000000' }],
				cursor: 'next-page',
				hasNextPage: true,
			})
			.mockResolvedValueOnce({
				balances: [{ coinType: '0x3::usdc::USDC', balance: '2500000' }],
				cursor: null,
				hasNextPage: false,
			});

		const result = await getSessionWalletTool({ network: 'testnet' });
		const content = result.structuredContent as unknown as {
			sessionWallet: { balances: Array<{ coinType: string }> };
		};

		expect(mocks.listBalances).toHaveBeenNthCalledWith(1, {
			owner: sessionAddress,
			cursor: null,
		});
		expect(mocks.listBalances).toHaveBeenNthCalledWith(2, {
			owner: sessionAddress,
			cursor: 'next-page',
		});
		expect(content.sessionWallet.balances).toHaveLength(2);
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
