// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { StakedCoin } from '../contracts/core/house.js';
import {
	claimOwnRedeemRequestAfterDelay,
	depositPublicPoolAndMintStakedCoins,
	redeemRequest,
} from '../contracts/core/sweethouse.js';
import type {
	ClaimOwnSweetHouseRedeemRequestAfterDelayOptions,
	DepositSweetHouseOptions,
	RedeemSweetHouseRequestOptions,
	WithConfig,
} from '../types/index.js';
import { toBigInt } from '../utils/numeric.js';
import { createBaseTransaction } from './shared.js';

export function buildDepositSweetHouseTransaction({
	config,
	owner,
	gasBudget,
	coinType,
	amount,
	useGasCoin,
}: WithConfig<DepositSweetHouseOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });
	const normalizedCoinType = normalizeStructTag(coinType);

	const hTokens = tx.add(
		depositPublicPoolAndMintStakedCoins({
			package: config.packageIds.core,
			typeArguments: [normalizedCoinType],
			arguments: [
				config.objectIds.sweetHouse,
				coinWithBalance({
					type: normalizedCoinType,
					balance: toBigInt(amount),
					useGasCoin,
				}),
			],
		}),
	);

	tx.transferObjects([hTokens], tx.pure.address(normalizeSuiAddress(owner)));

	return tx;
}

export function buildRedeemSweetHouseRequestTransaction({
	config,
	owner,
	gasBudget,
	coinType,
	amount,
}: WithConfig<RedeemSweetHouseRequestOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });
	const normalizedCoinType = normalizeStructTag(coinType);

	tx.add(
		redeemRequest({
			package: config.packageIds.core,
			typeArguments: [normalizedCoinType],
			arguments: [
				config.objectIds.sweetHouse,
				coinWithBalance({
					type: StakedCoin.typeTag({
						package: config.packageIds.core,
						typeArguments: [normalizedCoinType],
					}),
					balance: toBigInt(amount),
					useGasCoin: false,
				}),
			],
		}),
	);

	return tx;
}

export function buildClaimOwnSweetHouseRedeemRequestAfterDelayTransaction({
	config,
	owner,
	gasBudget,
	coinType,
	requestId,
}: WithConfig<ClaimOwnSweetHouseRedeemRequestAfterDelayOptions>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });

	tx.add(
		claimOwnRedeemRequestAfterDelay({
			package: config.packageIds.core,
			typeArguments: [normalizeStructTag(coinType)],
			arguments: [config.objectIds.sweetHouse, requestId],
		}),
	);

	return tx;
}
