// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	Transaction,
	TransactionArgument,
} from '@mysten/sui/transactions';
import type { BetMetadataInput } from './bet-metadata.type.js';
import type { CoinSide, PvPCoinflipAction } from './game.type.js';
import type { SuigarConfig } from './suigar-config.type.js';

export type WithGasBudget = {
	gasBudget?: Parameters<Transaction['setGasBudgetIfNotSet']>[0];
};

export type WithPartner<T> = T & {
	partner?: string;
};

export type WithThrowOnError<T = object> = T & {
	throwOnError?: boolean;
};

export type BaseTransactionOptions = WithGasBudget & {
	config: SuigarConfig;
	owner: string;
};

export type CoinTransactionOptions = {
	coinType: string;
	metadata?: BetMetadataInput;
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

export type BuildCoinflipTransactionOptions = SharedBetTransactionOptions & {
	side: CoinSide;
};

export type BuildLimboTransactionOptions = SharedBetTransactionOptions & {
	targetMultiplier: number;
	scale?: number;
};

export type BuildPlinkoTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
};

export type BuildRangeTransactionOptions = SharedBetTransactionOptions & {
	leftPoint: number;
	rightPoint: number;
	outOfRange?: boolean;
	scale?: number;
};

export type BuildSoccerTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
	countryId: number;
	shotZoneId: number;
};

export type BuildWheelTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
};

export type SharedPvPCoinflipTransactionOptions = BaseTransactionOptions &
	CoinTransactionOptions;

export type BuildCreatePvPCoinflipTransactionOptions = Pick<
	StakeTransactionOptions,
	'stake'
> &
	SharedPvPCoinflipTransactionOptions & {
		side: CoinSide;
		isPrivate?: boolean;
	};

export type BuildJoinPvPCoinflipTransactionOptions =
	SharedPvPCoinflipTransactionOptions & {
		gameId: string;
	};

export type ResolvedJoinPvPCoinflipTransactionOptions =
	BuildJoinPvPCoinflipTransactionOptions & {
		betCoin: TransactionArgument;
	};

export type BuildCancelPvPCoinflipTransactionOptions =
	SharedPvPCoinflipTransactionOptions & {
		gameId: string;
	};

export type BuildPvPCoinflipTransactionOptions<
	Action extends PvPCoinflipAction = PvPCoinflipAction,
> = Action extends 'create'
	? BuildCreatePvPCoinflipTransactionOptions
	: Action extends 'join'
		? BuildJoinPvPCoinflipTransactionOptions
		: Action extends 'cancel'
			? BuildCancelPvPCoinflipTransactionOptions
			: never;
