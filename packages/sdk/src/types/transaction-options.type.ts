// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@mysten/sui/transactions';
import type { BetMetadataInput } from './bet-metadata.type.js';
import type { CoinSide, PvPCoinflipAction } from './game.type.js';
import type { SuigarConfig } from './suigar-config.type.js';

export type WithPartner<T> = T & {
	partner?: string;
};

export type WithThrowOnError<T> = T & {
	throwOnError?: boolean;
};

export type WithConfig<T> = T & Pick<BaseTransactionOptions, 'config'>;

/** Common sender and gas settings for every SDK-built transaction. */
export type TransactionSenderOptions = {
	owner: string;
	gasBudget?: Parameters<Transaction['setGasBudgetIfNotSet']>[0];
};

export type BaseTransactionOptions = TransactionSenderOptions & {
	config: SuigarConfig;
	metadata?: BetMetadataInput;
};

export type CoinTransactionOptions = {
	coinType: string;
	useGasCoin?: boolean;
};

export type StakeTransactionOptions = {
	stake: number | bigint;
	cashStake?: number | bigint;
	betCount?: number | bigint;
};

export type SharedBetTransactionOptions = BaseTransactionOptions &
	CoinTransactionOptions &
	StakeTransactionOptions;

export type CoinflipTransactionOptions = SharedBetTransactionOptions & {
	side: CoinSide;
};

export type LimboTransactionOptions = SharedBetTransactionOptions & {
	targetMultiplier: number;
	scale?: number;
};

export type PlinkoTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
};

export type RangeTransactionOptions = SharedBetTransactionOptions & {
	leftPoint: number;
	rightPoint: number;
	outOfRange?: boolean;
	scale?: number;
};

export type SoccerTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
	countryId: number;
	shotZoneId: number;
};

export type WheelTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
};

type SharedPvPCoinflipTransactionOptions = BaseTransactionOptions &
	CoinTransactionOptions;

export type CreatePvPCoinflipTransactionOptions = Pick<
	StakeTransactionOptions,
	'stake'
> &
	SharedPvPCoinflipTransactionOptions & {
		side: CoinSide;
		isPrivate?: boolean;
	};

export type JoinPvPCoinflipTransactionOptions =
	SharedPvPCoinflipTransactionOptions & {
		gameId: string;
	};

export type CancelPvPCoinflipTransactionOptions =
	SharedPvPCoinflipTransactionOptions & {
		gameId: string;
	};

export type PvPCoinflipTransactionOptions<
	Action extends PvPCoinflipAction = PvPCoinflipAction,
> = Action extends 'create'
	? CreatePvPCoinflipTransactionOptions
	: Action extends 'join'
		? JoinPvPCoinflipTransactionOptions
		: Action extends 'cancel'
			? CancelPvPCoinflipTransactionOptions
			: never;

export type ClaimReferralCommissionOptions = TransactionSenderOptions &
	Pick<CoinTransactionOptions, 'coinType'>;

export type ClaimReferralLevelUpUsdRewardsOptions = TransactionSenderOptions;

export type MintNftV1Options = TransactionSenderOptions &
	Pick<CoinTransactionOptions, 'useGasCoin'> & {
		specId: string;
	};
