// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toolOutputSchema } from '../../src/tools/schemas/output.js';

const mocks = vi.hoisted(() => ({
	createSessionWalletSetup: vi.fn<() => Promise<unknown>>(),
	listBalances: vi.fn<() => Promise<unknown>>(),
	listSessionWallets: vi.fn<() => Promise<unknown>>(),
	loadCredentials: vi.fn<() => Promise<unknown>>(),
	loadSessionWallet: vi.fn<() => Promise<unknown>>(),
	runSuigarCommand:
		vi.fn<(...args: Array<string>) => { command: string; pid: number }>(),
}));

vi.mock('qrcode', () => ({
	default: {
		toDataURL: vi.fn<() => Promise<string>>(
			async () => 'data:image/png;base64,qr',
		),
	},
}));

vi.mock('../../src/runtime/index.js', () => ({
	createSuigarClient: (input: { network?: 'mainnet' | 'testnet' }) => ({
		config: { network: input.network ?? 'testnet' },
		client: {
			core: {
				listBalances: mocks.listBalances,
			},
		},
	}),
}));

vi.mock('../../src/utils/index.js', () => ({
	formatBaseUnitAmount: (value: string) =>
		value === '1200000000'
			? '1.2'
			: value === '1000000000'
				? '1'
				: value === '2500000'
					? '0.0025'
					: value,
	runSuigarCommand: mocks.runSuigarCommand,
}));

vi.mock('../../src/wallet/index.js', () => ({
	createSessionWalletSetup: mocks.createSessionWalletSetup,
	getExecutionStatus: vi.fn<() => void>(),
	listSessionWallets: mocks.listSessionWallets,
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
	resolveWalletOwner: vi.fn<() => void>(),
}));

const {
	fundSessionWalletTool,
	getSessionWalletTool,
	suigarLoginTool,
	suigarLogoutTool,
} = await import('../../src/tools/handlers/wallet.js');

const pairedAddress =
	'0x0000000000000000000000000000000000000000000000000000000000000001';
const sessionAddress =
	'0x0000000000000000000000000000000000000000000000000000000000000002';
const sessionWallet = {
	id: 'wallet-1',
	name: 'Daily bets',
	address: sessionAddress,
};

describe('wallet tools', () => {
	beforeEach(() => {
		mocks.createSessionWalletSetup.mockReset();
		mocks.listBalances.mockReset();
		mocks.listSessionWallets.mockReset();
		mocks.loadCredentials.mockReset();
		mocks.loadSessionWallet.mockReset();
		mocks.runSuigarCommand.mockReset();
		mocks.listSessionWallets.mockResolvedValue([sessionWallet]);
		mocks.listBalances.mockResolvedValue({
			balances: [{ coinType: '0x2::sui::SUI', balance: '1200000000' }],
			cursor: null,
			hasNextPage: false,
		});
	});

	describe('suigar_login', () => {
		it('starts the CLI login flow for the selected network', async () => {
			mocks.runSuigarCommand.mockReturnValue({
				command: 'npx -y @suigar/mcp@test login --network mainnet',
				pid: 1234,
			});

			const result = await suigarLoginTool({ network: 'mainnet' });
			const content = result.structuredContent as unknown as {
				connection: { command: string; pid: number; status: string };
			};

			expect(mocks.runSuigarCommand).toHaveBeenCalledWith(
				'login',
				'--network',
				'mainnet',
			);
			expect(content.connection).toMatchObject({
				command: 'npx -y @suigar/mcp@test login --network mainnet',
				pid: 1234,
				status: 'pending',
			});
		});
	});

	describe('suigar_logout', () => {
		it('starts the CLI logout flow for the selected network', async () => {
			mocks.runSuigarCommand.mockReturnValue({
				command: 'npx -y @suigar/mcp@test logout --network testnet',
				pid: 5678,
			});

			const result = await suigarLogoutTool({ network: 'testnet' });
			const content = result.structuredContent as unknown as {
				connection: { command: string; pid: number; status: string };
			};

			expect(mocks.runSuigarCommand).toHaveBeenCalledWith(
				'logout',
				'--network',
				'testnet',
			);
			expect(content.connection).toMatchObject({
				command: 'npx -y @suigar/mcp@test logout --network testnet',
				pid: 5678,
				status: 'pending',
			});
		});
	});

	describe('get_session_wallet', () => {
		it('returns formatted balances and a paired-wallet funding URL', async () => {
			mocks.loadSessionWallet.mockResolvedValue(sessionWallet);
			mocks.loadCredentials.mockResolvedValue({
				profiles: { testnet: { address: pairedAddress } },
			});

			const result = await getSessionWalletTool({ network: 'testnet' });
			const content = result.structuredContent as unknown as {
				sessionWallet: {
					status: string;
					selectedSessionWalletId: string;
					name: string;
					balances: Array<{ balanceDisplay: string; symbol: string }>;
					funding: { fundingUrl?: string };
				};
			};
			const fundingUrl = new URL(content.sessionWallet.funding.fundingUrl!);

			expect(content.sessionWallet.status).toBe('ready');
			expect(content.sessionWallet.selectedSessionWalletId).toBe('wallet-1');
			expect(content.sessionWallet.name).toBe('Daily bets');
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

			expect(result.structuredContent).toMatchObject({
				sessionWallet: {
					status: 'setup-required',
					setupUrl: 'http://127.0.0.1:12345/',
					wallets: [sessionWallet],
					note: expect.stringContaining('shared by mainnet and testnet'),
				},
			});
		});

		it('loads every balance page', async () => {
			mocks.loadSessionWallet.mockResolvedValue(sessionWallet);
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
			mocks.loadSessionWallet.mockResolvedValue(sessionWallet);
			mocks.loadCredentials.mockResolvedValue({ profiles: {} });

			const result = await getSessionWalletTool({ network: 'testnet' });
			const content = result.structuredContent as unknown as {
				sessionWallet: { funding: { fundingUrl?: string; note: string } };
			};

			expect(content.sessionWallet.funding).not.toHaveProperty('fundingUrl');
			expect(content.sessionWallet.funding.note).toContain('suigar_login');
		});

		it('returns JSON-safe structured content when no wallet is paired', async () => {
			mocks.loadSessionWallet.mockResolvedValue(sessionWallet);
			mocks.loadCredentials.mockResolvedValue({ profiles: {} });

			const result = await getSessionWalletTool({ network: 'testnet' });

			expect(toolOutputSchema.safeParse(result.structuredContent).success).toBe(
				true,
			);
		});
	});

	describe('fund_session_wallet', () => {
		it('returns a prefilled funding URL only when both wallets exist', async () => {
			mocks.loadCredentials.mockResolvedValue({
				profiles: { testnet: { address: pairedAddress } },
			});
			mocks.loadSessionWallet.mockResolvedValue(sessionWallet);

			const result = await fundSessionWalletTool({ network: 'testnet' });
			const content = result.structuredContent as unknown as {
				sessionWallet: { fundingUrl: string };
			};
			const url = new URL(content.sessionWallet.fundingUrl);

			expect(url.pathname).toBe('/fund-session-wallet');
			expect(url.searchParams.get('destination')).toBe(sessionAddress);
			expect(url.searchParams.get('owner')).toBe(pairedAddress);
			expect(url.searchParams.get('network')).toBe('testnet');
		});

		it('requires a paired wallet', async () => {
			mocks.loadCredentials.mockResolvedValue({ profiles: {} });
			mocks.loadSessionWallet.mockResolvedValue(sessionWallet);

			await expect(
				fundSessionWalletTool({ network: 'testnet' }),
			).rejects.toThrow('Call "suigar_login" first');
		});
	});
});
