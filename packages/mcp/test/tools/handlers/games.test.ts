// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildTransactionResult, ReadOnlyPlan } from '../../../src/runtime/types.js';
import {
	buildCoinflipTransactionTool,
	buildLimboTransactionTool,
	buildPlinkoTransactionTool,
	buildPvpCoinflipCancelTransactionTool,
	buildPvpCoinflipCreateTransactionTool,
	buildPvpCoinflipJoinTransactionTool,
	buildRangeTransactionTool,
	buildSoccerTransactionTool,
	buildWheelTransactionTool,
} from '../../../src/tools/handlers/index.js';

const mocks = vi.hoisted(() => ({
	buildTransactionBytes: vi.fn<(...args: Array<unknown>) => Promise<Uint8Array>>(),
}));

vi.mock('@mysten/sui/transactions', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@mysten/sui/transactions')>();

	return {
		...actual,
		Transaction: class MockTransaction extends actual.Transaction {
			override build = mocks.buildTransactionBytes as SuiTransaction['build'];
		},
	};
});

const owner = '0x0000000000000000000000000000000000000000000000000000000000000001';

beforeEach(() => {
	mocks.buildTransactionBytes.mockResolvedValue(new Uint8Array([1]));
});

afterEach(() => {
	mocks.buildTransactionBytes.mockReset();
});

describe('game transaction tools', () => {
	it.each([
		['coinflip', () => buildCoinflipTransactionTool({ mode: 'read-only', side: 'heads' })],
		['limbo', () => buildLimboTransactionTool({ mode: 'read-only', targetMultiplier: 2 })],
		['plinko', () => buildPlinkoTransactionTool({ mode: 'read-only', configId: 0 })],
		['wheel', () => buildWheelTransactionTool({ mode: 'read-only', configId: 0 })],
		[
			'range',
			() =>
				buildRangeTransactionTool({
					mode: 'read-only',
					leftPoint: 0.1,
					rightPoint: 0.4,
				}),
		],
		[
			'soccer',
			() =>
				buildSoccerTransactionTool({
					mode: 'read-only',
					configId: 0,
					countryId: 0,
					shotZoneId: 0,
				}),
		],
		[
			'pvp create',
			() =>
				buildPvpCoinflipCreateTransactionTool({
					mode: 'read-only',
					creatorSide: 'heads',
				}),
		],
		[
			'pvp join',
			() =>
				buildPvpCoinflipJoinTransactionTool({
					mode: 'read-only',
					gameId: '0x1',
				}),
		],
		[
			'pvp cancel',
			() =>
				buildPvpCoinflipCancelTransactionTool({
					mode: 'read-only',
					gameId: '0x1',
				}),
		],
	])('returns a read-only plan for %s', async (_name, run) => {
		const result = await run();
		const content = result.structuredContent as ReadOnlyPlan;

		expect(content.mode).toBe('read-only');
		expect(content.network).toBe('testnet');
		expect(content.plan.target).toMatch(/^0x.*::/u);
		expect(result.content[0].text).toContain('"read-only"');
	});

	it('returns serialized base64 bytes and summary for an SDK-backed build', async () => {
		mocks.buildTransactionBytes.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

		const result = await buildCoinflipTransactionTool({
			mode: 'build',
			owner,
			stake: 1_000,
			side: 'heads',
		});
		const content = result.structuredContent as BuildTransactionResult;

		expect(content.mode).toBe('build');
		expect(content.network).toBe('testnet');
		expect(content.transactionBytesBase64).toBe('AQIDBA==');
		expect(content.summary.game).toBe('coinflip');
		expect(content.summary.stake).toBe('1000000000000');
		expect(content.summary.stakeDisplay).toBe('1000');
		expect(content.summary.coinDecimals).toBe(9);
		expect(content.summary.gameInputs).toEqual({ side: 'heads' });
		expect(content.summary).not.toHaveProperty('action');
		expect(mocks.buildTransactionBytes).toHaveBeenCalledOnce();
	});

	it('treats stake input as the selected coin currency amount', async () => {
		const result = await buildCoinflipTransactionTool({
			mode: 'build',
			owner,
			stake: 1,
			side: 'heads',
		});
		const content = result.structuredContent as BuildTransactionResult;

		expect(content.summary.stake).toBe('1000000000');
		expect(content.summary.stakeDisplay).toBe('1');
	});

	it('formats the gas budget as MIST even when the wager coin has six decimals', async () => {
		const result = await buildCoinflipTransactionTool({
			mode: 'build',
			owner,
			stake: 1,
			side: 'heads',
			coinType:
				'0x47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_usdc::TEST_USDC',
			gasBudget: 50_000_000,
		});
		const content = result.structuredContent as BuildTransactionResult;

		expect(content.summary.coinDecimals).toBe(6);
		expect(content.summary.gasBudget).toBe('50000000');
		expect(content.summary.gasBudgetDisplay).toBe('0.05');
	});

	it('includes game-specific inputs in standard transaction summaries', async () => {
		const [limbo, plinko, wheel, range, soccer] = await Promise.all([
			buildLimboTransactionTool({
				mode: 'build',
				owner,
				stake: 1,
				targetMultiplier: 2.5,
			}),
			buildPlinkoTransactionTool({
				mode: 'build',
				owner,
				stake: 1,
				configId: 3,
			}),
			buildWheelTransactionTool({
				mode: 'build',
				owner,
				stake: 1,
				configId: 4,
			}),
			buildRangeTransactionTool({
				mode: 'build',
				owner,
				stake: 1,
				leftPoint: 25,
				rightPoint: 75,
				outOfRange: true,
			}),
			buildSoccerTransactionTool({
				mode: 'build',
				owner,
				stake: 1,
				configId: 1,
				countryId: 2,
				shotZoneId: 3,
			}),
		]);

		expect((limbo.structuredContent as BuildTransactionResult).summary.gameInputs).toEqual({
			targetMultiplier: 2.5,
		});
		expect((plinko.structuredContent as BuildTransactionResult).summary.gameInputs).toEqual({
			configId: 3,
		});
		expect((wheel.structuredContent as BuildTransactionResult).summary.gameInputs).toEqual({
			configId: 4,
		});
		expect((range.structuredContent as BuildTransactionResult).summary.gameInputs).toEqual({
			leftPoint: 25,
			rightPoint: 75,
			outOfRange: true,
		});
		expect((soccer.structuredContent as BuildTransactionResult).summary.gameInputs).toEqual({
			configId: 1,
			countryId: 2,
			shotZoneId: 3,
		});
	});

	it('throws actionable validation errors for missing build inputs', async () => {
		await expect(buildCoinflipTransactionTool({ mode: 'build', side: 'heads' })).rejects.toThrow(
			/stake/u,
		);
		await expect(
			buildCoinflipTransactionTool({
				mode: 'build',
				stake: 1_000,
				side: 'heads',
			}),
		).rejects.toThrow(/owner/u);
		await expect(
			buildCoinflipTransactionTool({ mode: 'build', owner, side: 'heads' }),
		).rejects.toThrow(/stake/u);
	});
});
