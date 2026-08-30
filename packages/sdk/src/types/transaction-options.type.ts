// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi } from '@mysten/sui/client';
import type { Transaction } from '@mysten/sui/transactions';
import type { BetMetadataInput } from './bet-metadata.type.js';
import type { CoinSide, Game, PvPCoinflipAction } from './game.type.js';
import type { SuigarConfig } from './suigar-config.type.js';

export type WithPartner<T> = T & {
	partner?: string;
};

export type WithThrowOnError<T> = T & {
	throwOnError?: boolean;
};

export type WithConfig<T = {}> = T & {
	config: SuigarConfig;
};

export type WithClient<T> = T & {
	client: ClientWithCoreApi;
};

export type WithGame<T, TGame extends Game = Game> = T & {
	game: TGame;
};

export type WithCoinType<T = {}> = T & {
	coinType: string;
};

/** Common sender and gas settings for every SDK-built transaction. */
export type TransactionSenderOptions = {
	owner: string;
	gasBudget?: Parameters<Transaction['setGasBudgetIfNotSet']>[0];
};

export type BaseTransactionOptions = WithConfig<
	TransactionSenderOptions & {
		metadata?: BetMetadataInput;
	}
>;

export type CoinTransactionOptions = WithCoinType<{
	useGasCoin?: boolean;
}>;

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

export type KenoTransactionOptions = SharedBetTransactionOptions & {
	configId: number;
	picks: Array<number>;
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

type SharedPvPCoinflipBetTransactionOptions = BaseTransactionOptions & CoinTransactionOptions;

export type CreatePvPCoinflipTransactionOptions = Pick<StakeTransactionOptions, 'stake'> &
	SharedPvPCoinflipBetTransactionOptions & {
		side: CoinSide;
		isPrivate?: boolean;
	};

export type JoinPvPCoinflipTransactionOptions = SharedPvPCoinflipBetTransactionOptions & {
	gameId: string;
};

export type CancelPvPCoinflipTransactionOptions = WithConfig<
	WithCoinType<TransactionSenderOptions> & {
		gameId: string;
	}
>;

export type PvPCoinflipTransactionOptions<Action extends PvPCoinflipAction = PvPCoinflipAction> =
	Action extends 'create'
		? CreatePvPCoinflipTransactionOptions
		: Action extends 'join'
			? JoinPvPCoinflipTransactionOptions
			: Action extends 'cancel'
				? CancelPvPCoinflipTransactionOptions
				: never;

export type ClaimReferralCommissionOptions = WithCoinType<TransactionSenderOptions>;

export type ClaimReferralLevelUpUsdRewardsOptions = TransactionSenderOptions;

export type MintNftV1Options = TransactionSenderOptions &
	Pick<CoinTransactionOptions, 'useGasCoin'> & {
		specId: string;
	};

export type DepositSweetHouseOptions = TransactionSenderOptions &
	CoinTransactionOptions & {
		amount: number | bigint;
	};

export type RedeemSweetHouseRequestOptions = Omit<DepositSweetHouseOptions, 'useGasCoin'>;

export type ClaimOwnSweetHouseRedeemRequestAfterDelayOptions = TransactionSenderOptions &
	WithCoinType<{
		requestId: string;
	}>;
