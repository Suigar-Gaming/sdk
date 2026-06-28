// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	coinWithBalance,
	Transaction,
	type TransactionResult,
} from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import {
	assertConfiguredBetGame,
	encodeBetMetadata,
	resolvePriceInfoObjectId,
} from '../helpers/index.js';
import type {
	BaseTransactionOptions,
	CoinTransactionOptions,
	EncodedBetMetadata,
	Game,
	SharedBetTransactionOptions,
	StakeTransactionOptions,
	WithPartner,
} from '../types/index.js';
import { DEFAULT_GAS_BUDGET_MIST, toBigInt } from '../utils/index.js';

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
		) => (tx: Transaction) => TransactionResult;
	}
>;

export function createBaseGameTransaction({
	config,
	game,
	owner,
	gasBudget,
}: CreateBaseGameTransactionOptions): Transaction {
	assertConfiguredBetGame(config, game);

	const tx = new Transaction();
	tx.setSenderIfNotSet(normalizeSuiAddress(owner));
	tx.setGasBudgetIfNotSet(gasBudget ?? DEFAULT_GAS_BUDGET_MIST);

	return tx;
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
	useGasCoin = true,
	buildRewardCoin,
}: BuildSharedBetTransactionOptions): Transaction {
	const tx = createBaseGameTransaction({ config, game, owner, gasBudget });
	const normalizedOwner = normalizeSuiAddress(owner);
	const normalizedCoinType = normalizeStructTag(coinType);
	const resolvedStake = toBigInt(stake);
	const resolvedCashStake = toBigInt(cashStake ?? stake);
	const resolvedBetCount = toBigInt(betCount ?? 1);
	const encodedMetadata = encodeBetMetadata(metadata, partner);
	const priceInfoObjectId = resolvePriceInfoObjectId(
		config,
		normalizedCoinType,
	);

	const betCoin = tx.add(
		coinWithBalance({
			type: normalizedCoinType,
			balance: resolvedCashStake,
			useGasCoin,
		}),
	);

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
			betCoin,
		}),
	);

	tx.transferObjects([rewardCoin], tx.pure.address(normalizedOwner));
	return tx;
}
