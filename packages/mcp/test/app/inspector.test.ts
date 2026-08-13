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
							eventName: 'BetResultEvent',
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
});
