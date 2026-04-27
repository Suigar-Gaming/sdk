// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	Transaction,
	type TransactionArgument,
	type TransactionResult,
} from '@mysten/sui/transactions';

import type {
	EncodedBetMetadata,
	BaseTransactionOptions,
	Game,
	SharedBetTransactionOptions,
	WithPartner,
	StakeTransactionOptions,
	CoinTransactionOptions,
} from '../types';
import {
	assertConfiguredBetGame,
	encodeBetMetadata,
	resolvePriceInfoObjectId,
} from '../helpers/index.js';
import { DEFAULT_GAS_BUDGET_MIST, toBigInt } from '../utils/index.js';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

type StrictStakeTransactionOptions = {
	[K in keyof StakeTransactionOptions]-?: Exclude<
		StakeTransactionOptions[K],
		number
	>;
};

export type BuildSharedBetTransactionContext = Pick<
	BaseTransactionOptions,
	'config' | 'owner'
> &
	Pick<CoinTransactionOptions, 'coinType'> &
	StrictStakeTransactionOptions & {
		tx: Transaction;
		metadata: EncodedBetMetadata;
		priceInfoObjectId: string;
		betCoin: TransactionResult;
	};

export type CreateBaseGameTransactionOptions = BaseTransactionOptions & {
	game: Game;
};

export type BuildSharedBetTransactionOptions = WithPartner<
	SharedBetTransactionOptions & {
		game: Game;
		buildRewardCoin: (
			context: BuildSharedBetTransactionContext,
		) => TransactionResult;
	}
>;

export function createBaseGameTransaction({
	config,
	game,
	owner,
	sender,
	gasBudget,
}: CreateBaseGameTransactionOptions): Transaction {
	assertConfiguredBetGame(config, game);

	const tx = new Transaction();
	tx.setSenderIfNotSet(normalizeSuiAddress(sender ?? owner));
	tx.setGasBudgetIfNotSet(gasBudget ?? DEFAULT_GAS_BUDGET_MIST);

	return tx;
}

export function buildSharedStandardGameBetCall({
	config,
	owner,
	sender,
	coinType,
	stake,
	cashStake,
	betCount,
	metadata,
	partner,
	allowGasCoinShortcut = true,
	buildRewardCoin,
}: BuildSharedBetTransactionOptions): (tx: Transaction) => TransactionArgument {
	return (tx: Transaction) => {
		const normalizedOwner = normalizeSuiAddress(sender ?? owner);
		const normalizedCoinType = normalizeStructTag(coinType);
		const resolvedStake = toBigInt(stake);
		const resolvedCashStake = toBigInt(cashStake ?? stake);
		const resolvedBetCount = toBigInt(betCount ?? 1);
		const encodedMetadata = encodeBetMetadata(metadata, partner);
		const priceInfoObjectId = resolvePriceInfoObjectId(
			config,
			normalizedCoinType,
		);

		const betCoin = tx.coin({
			type: normalizedCoinType,
			balance: resolvedCashStake,
			useGasCoin: allowGasCoinShortcut,
		});

		const rewardCoin = buildRewardCoin({
			tx,
			config,
			owner: normalizedOwner,
			coinType: normalizedCoinType,
			stake: resolvedStake,
			cashStake: resolvedCashStake,
			betCount: resolvedBetCount,
			metadata: encodedMetadata,
			priceInfoObjectId,
			betCoin,
		});

		tx.transferObjects([rewardCoin], tx.pure.address(normalizedOwner));
		return rewardCoin;
	};
}

export function buildSharedStandardGameBetTransaction(
	options: BuildSharedBetTransactionOptions,
): Transaction {
	const tx = createBaseGameTransaction(options);
	tx.add(buildSharedStandardGameBetCall(options));
	return tx;
}
