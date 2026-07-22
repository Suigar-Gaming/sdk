// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { PvPCoinflipAction, StandardGame } from './game.type.js';
import type {
	BuildCoinflipTransactionOptions,
	BuildLimboTransactionOptions,
	BuildPlinkoTransactionOptions,
	BuildPvPCoinflipTransactionOptions,
	BuildRangeTransactionOptions,
	BuildSoccerTransactionOptions,
	BuildWheelTransactionOptions,
} from './transaction-options.type.js';

type WithoutConfig<T> = Omit<T, 'config'>;

export type BuildGameOptions<GameId extends StandardGame> =
	GameId extends 'coinflip'
		? WithoutConfig<BuildCoinflipTransactionOptions>
		: GameId extends 'wheel'
			? WithoutConfig<BuildWheelTransactionOptions>
			: GameId extends 'limbo'
				? WithoutConfig<BuildLimboTransactionOptions>
				: GameId extends 'plinko'
					? WithoutConfig<BuildPlinkoTransactionOptions>
					: GameId extends 'range'
						? WithoutConfig<BuildRangeTransactionOptions>
						: GameId extends 'soccer'
							? WithoutConfig<BuildSoccerTransactionOptions>
							: never;

export type BuildPvPCoinflipGameOptions<Action extends PvPCoinflipAction> =
	WithoutConfig<BuildPvPCoinflipTransactionOptions<Action>>;
