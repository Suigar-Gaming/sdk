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

export type CreateGameBetOptions<TGame extends StandardGame = StandardGame> =
	TGame extends 'coinflip'
		? WithGame<WithoutConfig<CoinflipTransactionOptions>, TGame>
		: TGame extends 'wheel'
			? WithGame<WithoutConfig<WheelTransactionOptions>, TGame>
			: TGame extends 'limbo'
				? WithGame<WithoutConfig<LimboTransactionOptions>, TGame>
				: TGame extends 'plinko'
					? WithGame<WithoutConfig<PlinkoTransactionOptions>, TGame>
					: TGame extends 'range'
						? WithGame<WithoutConfig<RangeTransactionOptions>, TGame>
						: TGame extends 'soccer'
							? WithGame<WithoutConfig<SoccerTransactionOptions>, TGame>
							: never;

export type PvPCoinflipGameOptions<Action extends PvPCoinflipAction> =
	WithoutConfig<PvPCoinflipTransactionOptions<Action>>;
