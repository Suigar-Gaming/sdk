// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { extractDryRunErrors, summarizeDryRun, toJsonValue } from '../../src/runtime/dry-run.js';

const owner = '0x0000000000000000000000000000000000000000000000000000000000000001';

describe('dry-run JSON conversion', () => {
	it('converts dry-run payloads into JSON-safe values', () => {
		expect(
			toJsonValue({
				bytes: new Uint8Array([7, 8, 9]),
				amount: 1n,
				invalidNumber: Number.POSITIVE_INFINITY,
				omitted: undefined,
				nested: [true, undefined, null],
			}),
		).toEqual({
			bytes: [7, 8, 9],
			amount: '1',
			invalidNumber: 'Infinity',
			omitted: null,
			nested: [true, null, null],
		});
	});
});

describe('dry-run errors', () => {
	it('extracts failed transaction errors from nested status fields', () => {
		const dryRun = {
			FailedTransaction: {
				effects: {
					status: {
						error: 'MoveAbort in coinflip::play',
					},
				},
				transaction: {
					bcs: new Uint8Array([7, 8, 9]),
				},
			},
		};

		expect(extractDryRunErrors(dryRun as never)).toEqual(['MoveAbort in coinflip::play']);
	});

	it('deduplicates errors found on multiple dry-run branches', () => {
		const dryRun = {
			FailedTransaction: {
				message: 'same error',
				effects: {
					message: 'same error',
					status: {
						error: 'same error',
					},
				},
			},
		};

		expect(extractDryRunErrors(dryRun as never)).toEqual(['same error']);
	});
});

describe('dry-run summaries', () => {
	it('summarizes successful dry-run gas, balance changes, and event amounts', () => {
		const dryRun = {
			$kind: 'Transaction',
			Transaction: {
				effects: {
					status: { success: true, error: null },
					gasUsed: {
						computationCost: '1120000',
						storageCost: '35476800',
						storageRebate: '26792964',
						nonRefundableStorageFee: '0',
					},
				},
				balanceChanges: [
					{
						address: owner,
						coinType: '0x2::sui::SUI',
						amount: '-9803836',
					},
				],
				events: [
					{
						eventType: '0x1::core::BetResultEvent<0x2::coinflip::Game>',
						json: {
							player_bet: 'heads',
							coin_outcome: 'heads',
							stake_amount: '1000000000',
							outcome_amount: '2000000000',
						},
					},
				],
			},
		};

		const summary = summarizeDryRun(dryRun as never, {
			coinDecimals: 9,
		});

		expect(summary).toMatchObject({
			success: true,
			error: null,
			gasUsed: {
				computation: {
					raw: '1120000',
					display: '0.00112',
				},
				storage: {
					raw: '35476800',
					display: '0.0354768',
				},
				rebate: {
					raw: '26792964',
					display: '0.026792964',
				},
				net: {
					raw: '-9803836',
					display: '-0.009803836',
				},
			},
			balanceChanges: [
				{
					address: owner,
					coinType: '0x2::sui::SUI',
					amount: {
						raw: '-9803836',
						display: '-0.009803836',
					},
				},
			],
			events: [
				{
					type: '0x1::core::BetResultEvent<0x2::coinflip::Game>',
					fields: {
						player_bet: 'heads',
						coin_outcome: 'heads',
						stake_amount: '1000000000',
						stake_amount_display: '1',
						outcome_amount: '2000000000',
						outcome_amount_display: '2',
					},
				},
			],
		});
	});

	it('keeps parsed event identity for JSON bet result events after other events', () => {
		const dryRun = {
			$kind: 'Transaction',
			Transaction: {
				effects: {
					status: { success: true, error: null },
				},
				events: [
					{
						eventType: '0x1::core::BetPlacedEvent',
						json: {
							amount: '5000000',
							game_type: '0x2::coinflip::CoinFlip',
						},
					},
					{
						eventType: '0x1::core::BetResultEvent<0x2::coinflip::Game>',
						json: {
							player_bet: 'tails',
							coin_outcome: 'tails',
							stake_amount: '10000000000',
							outcome_amount: '20000000000',
						},
					},
				],
			},
		};

		const summary = summarizeDryRun(dryRun as never, {
			coinDecimals: 9,
		});

		expect(summary.events).toMatchObject([
			{
				type: '0x1::core::BetPlacedEvent',
				fields: {
					amount: '5000000',
					amount_display: '0.005',
					game_type: '0x2::coinflip::CoinFlip',
				},
			},
			{
				type: '0x1::core::BetResultEvent<0x2::coinflip::Game>',
				game: 'coinflip',
				event: 'BetResultEvent',
				fields: {
					player_bet: 'tails',
					coin_outcome: 'tails',
					stake_amount: '10000000000',
					stake_amount_display: '10',
					outcome_amount: '20000000000',
					outcome_amount_display: '20',
				},
			},
		]);
	});

	it('summarizes failed dry-runs without gas, balance, or event data', () => {
		const summary = summarizeDryRun(
			{
				$kind: 'FailedTransaction',
				FailedTransaction: {
					effects: {
						status: {
							success: false,
							error: {
								message: 'MoveAbort in coinflip::play',
							},
						},
					},
				},
			} as never,
			{ coinDecimals: 9 },
		);

		expect(summary).toEqual({
			success: false,
			error: 'MoveAbort in coinflip::play',
			gasUsed: {
				computation: null,
				storage: null,
				rebate: null,
				nonRefundableStorageFee: null,
				net: null,
			},
			balanceChanges: [],
			events: [],
		});
	});
});
