// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

import {
	claimCommissionBalance,
	claimReferrerLevelUpUsdRewards,
} from '../contracts/referral/referral.js';
import type {
	ClaimReferralCommissionOptions,
	ClaimReferralLevelUpUsdRewardsOptions,
	WithConfig,
} from '../types/index.js';
import { createBaseTransaction } from './shared.js';

export function buildClaimReferralCommissionTransaction({
	config,
	owner,
	gasBudget,
	coinType,
}: WithConfig<ClaimReferralCommissionOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });

	const claimedCoin = tx.add(
		claimCommissionBalance({
			package: config.packageIds.referral,
			typeArguments: [normalizeStructTag(coinType)],
			arguments: [config.objectIds.sweetHouse],
		}),
	);

	tx.transferObjects([claimedCoin], tx.pure.address(normalizeSuiAddress(owner)));

	return tx;
}

export function buildClaimReferralLevelUpUsdRewardsTransaction({
	config,
	owner,
	gasBudget,
}: WithConfig<ClaimReferralLevelUpUsdRewardsOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });

	const claimedCoin = tx.add(
		claimReferrerLevelUpUsdRewards({
			package: config.packageIds.referral,
			typeArguments: [normalizeStructTag(config.coins.usdc.coinType)],
			arguments: [config.objectIds.sweetHouse, config.coins.usdc.priceInfoObjectId],
		}),
	);

	tx.transferObjects([claimedCoin], tx.pure.address(normalizeSuiAddress(owner)));

	return tx;
}
