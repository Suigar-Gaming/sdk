// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { createInspectorViewModel } from '../../src/app/src/lib/inspector.js';
import { resolveAppView } from '../../src/app/src/views/index.js';

describe('createInspectorViewModel', () => {
	it('derives transaction, event, and display data from a transaction result', () => {
		const view = createInspectorViewModel(
			{
				network: 'testnet',
				summary: {
					game: 'coinflip',
					coinType: '0x2::sui::SUI',
					stake: '1000000000',
					stakeDisplay: '1 SUI',
					commands: [{ target: '0x1::coinflip::play' }],
					gameInputs: { side: 'tails' },
				},
				plan: {
					target: '0x1::coinflip::play',
					notes: ['Review before approving.'],
				},
				dryRun: {},
				dryRunSummary: {
					success: true,
					events: [
						{
							event: 'BetResultEvent',
							fields: { coin_outcome: 'tails' },
						},
					],
				},
			},
			[],
		);

		expect(view.coinBadge).toBe('SUI');
		expect(view.transactionEntries).toContainEqual(['Stake', '1 SUI (1000000000 base units)']);
		expect(view.dryRunEntries).toContainEqual(['Coin Outcome', 'tails']);
		expect(view.targets).toEqual(['0x1::coinflip::play', '0x1::coinflip::play']);
		expect(view.notes).toEqual(['Review before approving.']);
	});

	it('presents SweetHouse and NFT transaction plans with feature context', () => {
		const sweetHouseView = createInspectorViewModel(
			{
				network: 'testnet',
				plan: {
					target: '0x1::sweethouse::redeem_request',
					typeArguments: ['0x2::usdc::USDC'],
					requiredInputs: ['owner', 'amount'],
				},
				sweethouse: {
					action: 'redeem-request',
					coinType: '0x2::usdc::USDC',
					packageId: '0x1',
					sweetHouseId: '0x2',
				},
			},
			[],
		);
		const nftView = createInspectorViewModel(
			{
				network: 'testnet',
				plan: { target: '0x1::nft::mint_to_sender', requiredInputs: ['owner', 'specId'] },
				nft: { packageId: '0x1', factoryId: '0x2' },
			},
			[],
		);

		expect(sweetHouseView.contextEntries).toContainEqual(['Feature', 'SweetHouse']);
		expect(sweetHouseView.contextEntries).toContainEqual(['Action', 'redeem-request']);
		expect(sweetHouseView.transactionEntries).toContainEqual([
			'Required inputs',
			['owner', 'amount'],
		]);
		expect(nftView.contextEntries).toContainEqual(['Feature', 'NFT']);
	});

	it('recognizes feature metadata carried in built transaction summaries', () => {
		const sweetHouseView = createInspectorViewModel(
			{
				summary: {
					coinType: '0x2::usdc::USDC',
					stake: '10000000',
					stakeDisplay: '10 USDC',
					gameInputs: { sweetHouseAction: 'deposit' },
				},
			},
			[],
		);
		const nftView = createInspectorViewModel(
			{ summary: { gameInputs: { nftSpecId: '0xspec' } } },
			[],
		);
		const referralView = createInspectorViewModel(
			{ summary: { gameInputs: { referralClaim: 'commission' } } },
			[],
		);

		expect(sweetHouseView.contextEntries).toContainEqual(['Feature', 'SweetHouse']);
		expect(sweetHouseView.contextEntries).toContainEqual(['Action', 'deposit']);
		expect(sweetHouseView.transactionEntries).toContainEqual([
			'Amount',
			'10 USDC (10000000 base units)',
		]);
		expect(nftView.contextEntries).toContainEqual(['Feature', 'NFT']);
		expect(referralView.contextEntries).toContainEqual(['Feature', 'Referral']);
	});

	it('prioritizes explicit host errors over errors in the tool payload', () => {
		const view = createInspectorViewModel({ errors: ['Server-side error'] }, [
			'RangeError: unsupported coin',
		]);

		expect(view.errors).toEqual(['RangeError: unsupported coin']);
	});
});

describe('execution views', () => {
	it('uses the session-wallet view when a session wallet result is available', () => {
		expect(
			resolveAppView({
				sessionWallet: {
					address: '0x1',
					balances: [
						{
							coinType: '0x2::sui::SUI',
							balanceDisplay: '1',
							symbol: 'SUI',
						},
					],
					funding: { fundingUrl: 'https://example.test/fund' },
				},
			}),
		).toMatchObject({ title: 'Session Wallet' });
	});

	it('uses the status view for direct session-wallet execution', () => {
		expect(
			resolveAppView({
				summary: { game: 'coinflip' },
				execution: {
					wallet: 'session',
					address: '0x1',
					status: 'success',
					digest: 'digest',
				},
			}),
		).toMatchObject({ title: 'Transaction Status' });
	});

	it('uses the transaction inspector for SweetHouse and NFT plans', () => {
		expect(resolveAppView({ sweethouse: {}, plan: {} })).toMatchObject({
			title: 'SweetHouse Transaction',
		});
		expect(resolveAppView({ nft: {}, plan: {} })).toMatchObject({ title: 'NFT Transaction' });
	});
});
