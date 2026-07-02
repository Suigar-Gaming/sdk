// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { describe, expect, it, vi } from 'vitest';
import {
	buildCoinflipTransactionTool,
	buildLimboTransactionTool,
	buildPlinkoTransactionTool,
	buildPvpCoinflipCancelTransactionTool,
	buildPvpCoinflipCreateTransactionTool,
	buildPvpCoinflipJoinTransactionTool,
	buildRangeTransactionTool,
	buildWheelTransactionTool,
	readConfigTool,
	readGameMetadataTool,
} from '../../src/tools/handlers.js';

const owner =
	'0x0000000000000000000000000000000000000000000000000000000000000001';

describe('read tools', () => {
	it('defaults read_config to testnet and returns SDK-shaped config', async () => {
		const result = await readConfigTool({});
		const content = result.structuredContent as Awaited<
			ReturnType<typeof readConfigTool>
		>['structuredContent'] & {
			supportedGames: Array<{ id: string }>;
		};

		expect(content.network).toBe('testnet');
		expect(content.config.sdk.packageIds.coinflip).toMatch(/^0x/u);
		expect(content.config.sdk.coins.sui.coinType).toMatch(/::/u);
		expect(content.supportedGames.map((game) => game.id)).toContain(
			'pvp-coinflip',
		);
	});

	it('reads game metadata for a selected game and coin type', async () => {
		const result = await readGameMetadataTool({
			game: 'coinflip',
			coinType: '0x2::sui::SUI',
		});
		const content = result.structuredContent as {
			game: { id: string; coinType: string; packageId: string } | null;
		};

		expect(content.game?.id).toBe('coinflip');
		expect(content.game?.coinType).toMatch(/::sui::SUI$/u);
		expect(content.game?.packageId).toMatch(/^0x/u);
	});
});

describe('read-only transaction tools', () => {
	it.each([
		[
			'coinflip',
			() => buildCoinflipTransactionTool({ mode: 'read-only', side: 'heads' }),
		],
		[
			'limbo',
			() =>
				buildLimboTransactionTool({ mode: 'read-only', targetMultiplier: 2 }),
		],
		[
			'plinko',
			() => buildPlinkoTransactionTool({ mode: 'read-only', configId: 0 }),
		],
		[
			'wheel',
			() => buildWheelTransactionTool({ mode: 'read-only', configId: 0 }),
		],
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
		const content = result.structuredContent as {
			mode: string;
			plan: { target: string | null };
		};

		expect(content.mode).toBe('read-only');
		expect(content.plan.target).toMatch(/^0x.*::/u);
		expect(result.content[0].text).toContain('"read-only"');
	});
});

describe('build transaction tools', () => {
	it('returns serialized base64 bytes and summary for an SDK-backed build', async () => {
		const buildSpy = vi
			.spyOn(Transaction.prototype, 'build')
			.mockResolvedValue(new Uint8Array([1, 2, 3, 4]));

		try {
			const result = await buildCoinflipTransactionTool({
				mode: 'build',
				owner,
				stake: 1_000,
				side: 'heads',
			});
			const content = result.structuredContent as {
				mode: string;
				transactionBytesBase64?: string;
				summary: {
					game?: string;
					stake?: string;
					stakeDisplay?: string;
					coinDecimals?: number;
					gameInputs?: Record<string, unknown>;
				};
			};

			expect(content.mode).toBe('build');
			expect(content.transactionBytesBase64).toBe('AQIDBA==');
			expect(content.summary.game).toBe('coinflip');
			expect(content.summary.stake).toBe('1000000000000');
			expect(content.summary.stakeDisplay).toBe('1000');
			expect(content.summary.coinDecimals).toBe(9);
			expect(content.summary.gameInputs).toEqual({ side: 'heads' });
			expect(content.summary).not.toHaveProperty('action');
			expect(buildSpy).toHaveBeenCalledOnce();
		} finally {
			buildSpy.mockRestore();
		}
	});

	it('treats stake input as the selected coin currency amount', async () => {
		const buildSpy = vi
			.spyOn(Transaction.prototype, 'build')
			.mockResolvedValue(new Uint8Array([1]));

		try {
			const result = await buildCoinflipTransactionTool({
				mode: 'build',
				owner,
				stake: 1,
				side: 'heads',
			});
			const content = result.structuredContent as {
				summary: { stake?: string; stakeDisplay?: string };
			};

			expect(content.summary.stake).toBe('1000000000');
			expect(content.summary.stakeDisplay).toBe('1');
		} finally {
			buildSpy.mockRestore();
		}
	});

	it('includes game-specific inputs in standard transaction summaries', async () => {
		const buildSpy = vi
			.spyOn(Transaction.prototype, 'build')
			.mockResolvedValue(new Uint8Array([1]));

		try {
			const [limbo, plinko, wheel, range] = await Promise.all([
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
			]);

			expect(
				(limbo.structuredContent as { summary: { gameInputs?: unknown } })
					.summary.gameInputs,
			).toEqual({ targetMultiplier: 2.5 });
			expect(
				(plinko.structuredContent as { summary: { gameInputs?: unknown } })
					.summary.gameInputs,
			).toEqual({ configId: 3 });
			expect(
				(wheel.structuredContent as { summary: { gameInputs?: unknown } })
					.summary.gameInputs,
			).toEqual({ configId: 4 });
			expect(
				(range.structuredContent as { summary: { gameInputs?: unknown } })
					.summary.gameInputs,
			).toEqual({ leftPoint: 25, rightPoint: 75, outOfRange: true });
		} finally {
			buildSpy.mockRestore();
		}
	});

	it('throws actionable validation errors for missing build inputs', async () => {
		await expect(
			buildCoinflipTransactionTool({ mode: 'build', side: 'heads' }),
		).rejects.toThrow(/stake/u);
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
