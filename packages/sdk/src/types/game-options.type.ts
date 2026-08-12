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
	WithGame,
} from './transaction-options.type.js';

type WithoutConfig<T> = Omit<T, 'config'>;

type StandardGameTransactionOptionsRegistry = {
	coinflip: CoinflipTransactionOptions;
	wheel: WheelTransactionOptions;
	limbo: LimboTransactionOptions;
	plinko: PlinkoTransactionOptions;
	range: RangeTransactionOptions;
	soccer: SoccerTransactionOptions;
};

export type CreateGameBetOptions<TGame extends StandardGame = StandardGame> = {
	[Game in TGame]: WithGame<
		WithoutConfig<StandardGameTransactionOptionsRegistry[Game]>,
		Game
	>;
}[TGame];

export type PvPCoinflipGameOptions<Action extends PvPCoinflipAction> =
	WithoutConfig<PvPCoinflipTransactionOptions<Action>>;
