// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { describe, expect, it } from 'vitest';
import {
	buildClaimReferralCommissionTransaction,
	buildClaimReferralLevelUpUsdRewardsTransaction,
} from '../../../src/transactions/referral.js';
import { TEST_CONFIG } from '../../utils.js';
import './utils.js';

describe('referral transaction builder', () => {
	it('builds referral commission and level-up claims with configured package overrides', () => {
		const commissionTx = buildClaimReferralCommissionTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			config: TEST_CONFIG,
		});
		const levelUpTx = buildClaimReferralLevelUpUsdRewardsTransaction({
			owner: '0x123',
			config: TEST_CONFIG,
		});

		const commissionCall = commissionTx.getData().commands[0].MoveCall!;
		const levelUpCall = levelUpTx.getData().commands[0].MoveCall!;

		expect(commissionTx.getData().sender).toBe(normalizeSuiAddress('0x123'));
		expect(commissionCall.package).toBe(normalizeSuiAddress(TEST_CONFIG.packageIds.referral));
		expect(commissionCall.function).toBe('claim_commission_balance');
		expect(commissionCall.typeArguments).toEqual([normalizeStructTag('0x2::sui::SUI')]);
		expect(levelUpCall.package).toBe(normalizeSuiAddress(TEST_CONFIG.packageIds.referral));
		expect(levelUpCall.function).toBe('claim_referrer_level_up_usd_rewards_v2');
		expect(levelUpCall.typeArguments).toEqual([TEST_CONFIG.coins.usdc.coinType]);
		expect(levelUpCall.arguments).toHaveLength(3);
	});
});
