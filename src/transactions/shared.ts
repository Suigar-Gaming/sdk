// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	TransactionArgument,
	TransactionResult,
} from '@mysten/sui/transactions';
import { Transaction } from '@mysten/sui/transactions';

import type {
	EncodedBetMetadata,
	Game,
	SharedBetTransactionOptions,
	SuigarConfig,
	WithPartner,
} from '../types';
import {
	assertConfiguredBetGame,
	encodeBetMetadata,
	resolvePriceInfoObjectId,
} from '../helpers/index.js';
import { DEFAULT_GAS_BUDGET_MIST, toBigIntAmount } from '../utils/index.js';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';

export type BuildSharedBetTransactionContext = {
	tx: Transaction;
	config: SuigarConfig;
	owner: string;
	coinType: string;
	stake: bigint;
	cashStake: bigint;
	betCount: bigint;
	metadata: EncodedBetMetadata;
	priceInfoObjectId: string;
	betCoin: TransactionResult;
};

export type CreateBaseGameTransactionOptions = {
	config: SuigarConfig;
	game: Game;
	owner: string;
	sender?: string;
	gasBudget?: number | bigint;
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
		const resolvedStake = toBigIntAmount(stake, 'stake');
		const resolvedCashStake = toBigIntAmount(cashStake ?? stake, 'cashStake');
		const resolvedBetCount = toBigIntAmount(betCount ?? 1, 'betCount');
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
