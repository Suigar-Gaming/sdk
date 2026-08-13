// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	coinWithBalance,
	Transaction,
	TransactionArgument,
	type TransactionResult,
} from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

import { assertConfiguredBetGame, resolvePriceInfoObjectId } from '../helpers/config.js';
import { encodeBetMetadata } from '../helpers/metadata.js';
import type {
	BaseTransactionOptions,
	EncodedBetMetadata,
	SharedBetTransactionOptions,
	StakeTransactionOptions,
	TransactionSenderOptions,
	WithCoinType,
	WithGame,
	WithPartner,
} from '../types/index.js';
import { DEFAULT_GAS_BUDGET_MIST } from '../utils/constants.js';
import { toBigInt } from '../utils/numeric.js';

type StrictStakeTransactionOptions = {
	[K in keyof StakeTransactionOptions]-?: Exclude<StakeTransactionOptions[K], number>;
};

type SharedBetTransactionContext = WithCoinType<
	Pick<BaseTransactionOptions, 'config' | 'owner'> &
		StrictStakeTransactionOptions & {
			betCoin: TransactionArgument;
			metadata: EncodedBetMetadata;
			priceInfoObjectId: string;
		}
>;

type CreateBaseGameTransactionOptions = WithGame<BaseTransactionOptions>;

type StandardGameBetTransactionOptions = WithPartner<
	WithGame<
		SharedBetTransactionOptions & {
			buildRewardCoin: (
				context: SharedBetTransactionContext,
			) => (tx: Transaction) => TransactionResult;
		}
	>
>;

/** Creates a transaction with its sender and default gas budget configured. */
export function createBaseTransaction({ owner, gasBudget }: TransactionSenderOptions): Transaction {
	const tx = new Transaction();
	tx.setSenderIfNotSet(normalizeSuiAddress(owner));
	tx.setGasBudgetIfNotSet(gasBudget ?? DEFAULT_GAS_BUDGET_MIST);
	return tx;
}

export function createBaseGameTransaction({
	config,
	game,
	owner,
	gasBudget,
}: CreateBaseGameTransactionOptions): Transaction {
	assertConfiguredBetGame({ config, game });
	return createBaseTransaction({ owner, gasBudget });
}

export function buildSharedStandardGameBetTransaction({
	config,
	owner,
	gasBudget,
	game,
	coinType,
	stake,
	cashStake,
	betCount,
	metadata,
	partner,
	useGasCoin,
	buildRewardCoin,
}: StandardGameBetTransactionOptions): Transaction {
	const tx = createBaseGameTransaction({ config, game, owner, gasBudget });
	const normalizedOwner = normalizeSuiAddress(owner);
	const normalizedCoinType = normalizeStructTag(coinType);
	const resolvedStake = toBigInt(stake);
	const resolvedCashStake = toBigInt(cashStake ?? stake);
	const resolvedBetCount = toBigInt(betCount ?? 1);
	const encodedMetadata = encodeBetMetadata({ metadata, partner });
	const priceInfoObjectId = resolvePriceInfoObjectId({
		config,
		coinType: normalizedCoinType,
	});

	const rewardCoin = tx.add(
		buildRewardCoin({
			config,
			owner: normalizedOwner,
			coinType: normalizedCoinType,
			stake: resolvedStake,
			cashStake: resolvedCashStake,
			betCount: resolvedBetCount,
			metadata: encodedMetadata,
			priceInfoObjectId,
			betCoin: coinWithBalance({
				type: normalizedCoinType,
				balance: resolvedCashStake,
				useGasCoin,
			}),
		}),
	);

	tx.transferObjects([rewardCoin], tx.pure.address(normalizedOwner));
	return tx;
}
