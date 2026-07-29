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

/**
 * Returns a composable Move-call thunk for claiming commission in `coinType`.
 * The caller must be the referrer; the Move contract derives the referrer from
 * the transaction sender.
 */
function claimReferralCommissionCall({
	config,
	coinType,
}: WithConfig<Pick<ClaimReferralCommissionOptions, 'coinType'>>) {
	return claimCommissionBalance({
		package: config.packageIds.referral,
		typeArguments: [normalizeStructTag(coinType)],
		arguments: [config.objectIds.sweetHouse],
	});
}

/**
 * Returns a composable Move-call thunk for claiming the configured USD reward.
 * The configured `usdc` metadata supplies both the dollar coin type and Pyth
 * price-info object required by the referral contract.
 */
function claimReferralLevelUpUsdRewardsCall({ config }: WithConfig<{}>) {
	return claimReferrerLevelUpUsdRewards({
		package: config.packageIds.referral,
		typeArguments: [normalizeStructTag(config.coins.usdc.coinType)],
		arguments: [
			config.objectIds.sweetHouse,
			config.coins.usdc.priceInfoObjectId,
		],
	});
}

/** Builds a complete commission claim transaction and transfers the returned coin to `owner`. */
export function buildClaimReferralCommissionTransaction({
	config,
	owner,
	gasBudget,
	coinType,
}: WithConfig<ClaimReferralCommissionOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });
	const claimedCoin = tx.add(claimReferralCommissionCall({ config, coinType }));
	tx.transferObjects(
		[claimedCoin],
		tx.pure.address(normalizeSuiAddress(owner)),
	);
	return tx;
}

/** Builds a complete level-up USD reward claim and transfers the configured dollar coin to `owner`. */
export function buildClaimReferralLevelUpUsdRewardsTransaction({
	config,
	owner,
	gasBudget,
}: WithConfig<ClaimReferralLevelUpUsdRewardsOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });
	const claimedCoin = tx.add(claimReferralLevelUpUsdRewardsCall({ config }));
	tx.transferObjects(
		[claimedCoin],
		tx.pure.address(normalizeSuiAddress(owner)),
	);
	return tx;
}
