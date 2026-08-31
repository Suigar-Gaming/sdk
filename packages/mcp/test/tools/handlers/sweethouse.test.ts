// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildTransactionResult } from '../../../src/runtime/types.js';
import {
	buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionTool,
	buildSweetHouseDepositTransactionTool,
	buildSweetHouseRedeemRequestTransactionTool,
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

const testAddress = (fill: string) => `0x${fill.repeat(64)}`;
const owner = testAddress('a');
const requestId = testAddress('b');

beforeEach(() => {
	mocks.buildTransactionBytes.mockResolvedValue(new Uint8Array([1]));
});

afterEach(() => {
	mocks.buildTransactionBytes.mockReset();
});

describe('SweetHouse transaction tools', () => {
	it.each([
		[
			'deposit',
			() => buildSweetHouseDepositTransactionTool({ mode: 'read-only' }),
			'deposit_public_pool_and_mint_staked_coins',
			['owner', 'amount'],
		],
		[
			'redeem request',
			() => buildSweetHouseRedeemRequestTransactionTool({ mode: 'read-only' }),
			'redeem_request',
			['owner', 'amount'],
		],
		[
			'delayed claim',
			() =>
				buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionTool({
					mode: 'read-only',
				}),
			'claim_own_redeem_request_after_delay',
			['owner', 'requestId'],
		],
	])('returns a read-only plan for %s', async (_name, run, functionName, requiredInputs) => {
		const result = await run();
		const content = result.structuredContent as {
			mode: 'read-only';
			plan: { target: string; requiredInputs: Array<string> };
			sweethouse: { packageId: string; sweetHouseId: string };
		};

		expect(content.mode).toBe('read-only');
		expect(content.plan.target).toContain(`::sweethouse::${functionName}`);
		expect(content.plan.requiredInputs).toEqual(requiredInputs);
		expect(content.sweethouse.packageId).toMatch(/^(?:0x|@suigar\/)/u);
		expect(content.sweethouse.sweetHouseId).toMatch(/^0x/u);
	});

	it('builds SDK-backed SweetHouse transactions', async () => {
		const [deposit, redeem, claim] = await Promise.all([
			buildSweetHouseDepositTransactionTool({
				mode: 'build',
				owner,
				amount: '1',
			}),
			buildSweetHouseRedeemRequestTransactionTool({
				mode: 'build',
				owner,
				amount: '1',
			}),
			buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionTool({
				mode: 'build',
				owner,
				requestId,
			}),
		]);

		const depositSummary = (deposit.structuredContent as BuildTransactionResult).summary;
		const redeemSummary = (redeem.structuredContent as BuildTransactionResult).summary;
		const claimSummary = (claim.structuredContent as BuildTransactionResult).summary;

		expect(depositSummary.gameInputs).toEqual({ sweetHouseAction: 'deposit' });
		expect(redeemSummary.gameInputs).toEqual({ sweetHouseAction: 'redeem-request' });
		expect(claimSummary.gameInputs).toEqual({
			sweetHouseAction: 'claim-own-redeem-request-after-delay',
			requestId,
		});
		expect(depositSummary.commands).toEqual([]);
		expect(redeemSummary.commands).toEqual([]);
		expect(claimSummary.commands).toEqual([]);
		expect(mocks.buildTransactionBytes).toHaveBeenCalledTimes(3);
	});
});
