// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction as SuiTransaction } from '@mysten/sui/transactions';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BuildTransactionResult, ReadOnlyPlan } from '../../../src/runtime/types.js';
import {
	buildReferralCommissionClaimTransactionTool,
	buildReferralLevelUpUsdRewardsClaimTransactionTool,
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

const owner = `0x${'a'.repeat(64)}`;

beforeEach(() => {
	mocks.buildTransactionBytes.mockResolvedValue(new Uint8Array([1]));
});

afterEach(() => {
	mocks.buildTransactionBytes.mockReset();
});

describe('referral transaction tools', () => {
	it.each([
		['commission claim', () => buildReferralCommissionClaimTransactionTool({ mode: 'read-only' })],
		[
			'level-up USD rewards claim',
			() =>
				buildReferralLevelUpUsdRewardsClaimTransactionTool({
					mode: 'read-only',
				}),
		],
	])('returns a read-only plan for %s', async (_name, run) => {
		const result = await run();
		const content = result.structuredContent as ReadOnlyPlan;

		expect(content.mode).toBe('read-only');
		expect(content.network).toBe('testnet');
		expect(content.plan.target).toMatch(/^(?:0x|@suigar\/).*::/u);
		expect(result.content[0].text).toContain('"read-only"');
	});

	it('uses the generated commission claim target in its referral plan', async () => {
		const result = await buildReferralCommissionClaimTransactionTool({
			mode: 'read-only',
		});
		const content = result.structuredContent as ReadOnlyPlan;

		expect(content.plan.target).toContain('::claim_commission_balance');
	});

	it('uses the generated level-up USD claim target in its referral plan', async () => {
		const result = await buildReferralLevelUpUsdRewardsClaimTransactionTool({
			mode: 'read-only',
		});
		const content = result.structuredContent as ReadOnlyPlan;

		expect(content.plan.target).toContain('::claim_referrer_level_up_usd_rewards');
	});

	it('builds SDK-backed commission and level-up USD reward claims', async () => {
		const [commission, levelUp] = await Promise.all([
			buildReferralCommissionClaimTransactionTool({ mode: 'build', owner }),
			buildReferralLevelUpUsdRewardsClaimTransactionTool({
				mode: 'build',
				owner,
			}),
		]);
		const commissionSummary = (commission.structuredContent as BuildTransactionResult).summary;
		const levelUpSummary = (levelUp.structuredContent as BuildTransactionResult).summary;

		expect(commissionSummary.gameInputs).toEqual({
			referralClaim: 'commission',
		});
		expect(levelUpSummary.gameInputs).toEqual({
			referralClaim: 'level-up-usd-rewards',
		});
		expect(commissionSummary.commands).toEqual([]);
		expect(levelUpSummary.commands).toEqual([]);
	});
});
