// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { PvPCoinflipAction, StandardGame } from './game.type.js';
import type {
	CoinflipTransactionOptions,
	LimboTransactionOptions,
	PlinkoTransactionOptions,
	PvPCoinflipTransactionOptions,
	RangeTransactionOptions,
	SoccerTransactionOptions,
	WheelTransactionOptions,
} from './transaction-options.type.js';

type WithoutConfig<T> = Omit<T, 'config'>;

export type CreateGameBetOptions<GameId extends StandardGame> =
	GameId extends 'coinflip'
		? WithoutConfig<CoinflipTransactionOptions>
		: GameId extends 'wheel'
			? WithoutConfig<WheelTransactionOptions>
			: GameId extends 'limbo'
				? WithoutConfig<LimboTransactionOptions>
				: GameId extends 'plinko'
					? WithoutConfig<PlinkoTransactionOptions>
					: GameId extends 'range'
						? WithoutConfig<RangeTransactionOptions>
						: GameId extends 'soccer'
							? WithoutConfig<SoccerTransactionOptions>
							: never;

export type PvPCoinflipGameOptions<Action extends PvPCoinflipAction> =
	WithoutConfig<PvPCoinflipTransactionOptions<Action>>;
