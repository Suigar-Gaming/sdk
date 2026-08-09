// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { describe, expect, it, vi } from 'vitest';
import type {
	BuildTransactionResult,
	ReadOnlyPlan,
} from '../../../src/runtime/types.js';
import {
	buildReferralCommissionClaimTransactionTool,
	buildReferralLevelUpUsdRewardsClaimTransactionTool,
} from '../../../src/tools/handlers/index.js';

const owner =
	'0x0000000000000000000000000000000000000000000000000000000000000001';

describe('referral transaction tools', () => {
	it.each([
		[
			'commission claim',
			() => buildReferralCommissionClaimTransactionTool({ mode: 'read-only' }),
		],
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
		expect(content.plan.target).toMatch(/^0x.*::/u);
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

		expect(content.plan.target).toContain(
			'::claim_referrer_level_up_usd_rewards',
		);
	});

	it('builds SDK-backed commission and level-up USD reward claims', async () => {
		const buildSpy = vi
			.spyOn(Transaction.prototype, 'build')
			.mockResolvedValue(new Uint8Array([1]));

		try {
			const [commission, levelUp] = await Promise.all([
				buildReferralCommissionClaimTransactionTool({ mode: 'build', owner }),
				buildReferralLevelUpUsdRewardsClaimTransactionTool({
					mode: 'build',
					owner,
				}),
			]);
			const commissionSummary = (
				commission.structuredContent as BuildTransactionResult
			).summary;
			const levelUpSummary = (
				levelUp.structuredContent as BuildTransactionResult
			).summary;

			expect(commissionSummary.gameInputs).toEqual({
				referralClaim: 'commission',
			});
			expect(levelUpSummary.gameInputs).toEqual({
				referralClaim: 'level-up-usd-rewards',
			});
			expect(commissionSummary.commandCount).toBeGreaterThan(1);
			expect(levelUpSummary.commandCount).toBeGreaterThan(1);
		} finally {
			buildSpy.mockRestore();
		}
	});
});
