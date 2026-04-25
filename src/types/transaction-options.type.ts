// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction, TransactionResult } from '@mysten/sui/transactions';

import type { BetMetadataInput } from './bet-metadata.type';
import type { CoinSide } from './game.type';
import type { SharedBetTransactionOptions } from './shared-bet-transaction-options.type';
import type { SuigarConfig } from './suigar-config.type';

export type WithPartner<T> = T & {
	partner?: string;
};

export type WithThrowOnError<T = object> = T & {
	throwOnError?: boolean;
};

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

export type BuildWheelTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
};

export type PvPCoinflipAction = 'create' | 'join' | 'cancel';

export type SharedPvPCoinflipTransactionOptions = {
	config: SuigarConfig;
	owner: string;
	coinType: string;
	metadata?: BetMetadataInput;
	gasBudget?: number | bigint;
	sender?: string;
	allowGasCoinShortcut?: boolean;
};

export type BuildCreatePvPCoinflipTransactionOptions =
	SharedPvPCoinflipTransactionOptions & {
		stake: number | bigint;
		side: CoinSide;
		isPrivate?: boolean;
	};

export type BuildJoinPvPCoinflipTransactionOptions =
	SharedPvPCoinflipTransactionOptions & {
		gameId: string;
	};

export type ResolvedJoinPvPCoinflipTransactionOptions =
	BuildJoinPvPCoinflipTransactionOptions & {
		betCoin: (tx: Transaction) => Promise<TransactionResult>;
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
