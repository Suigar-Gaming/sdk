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

export type CreateGameBetOptions<TGame extends StandardGame> =
	TGame extends 'coinflip'
		? WithoutConfig<CoinflipTransactionOptions>
		: TGame extends 'wheel'
			? WithoutConfig<WheelTransactionOptions>
			: TGame extends 'limbo'
				? WithoutConfig<LimboTransactionOptions>
				: TGame extends 'plinko'
					? WithoutConfig<PlinkoTransactionOptions>
					: TGame extends 'range'
						? WithoutConfig<RangeTransactionOptions>
						: TGame extends 'soccer'
							? WithoutConfig<SoccerTransactionOptions>
							: never;

export type PvPCoinflipGameOptions<Action extends PvPCoinflipAction> =
	WithoutConfig<PvPCoinflipTransactionOptions<Action>>;
