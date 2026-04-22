// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type {
	BuildCoinflipTransactionOptions,
	BuildPvPCoinflipTransactionOptions,
	BuildWheelTransactionOptions,
	BuildLimboTransactionOptions,
	BuildPlinkoTransactionOptions,
	PvPCoinflipAction,
	BuildRangeTransactionOptions,
} from './transaction-options.type';
import type { StandardGame } from './game.type';

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
						: never;

export type BuildPvPGameOptions<Action extends PvPCoinflipAction> =
	WithoutConfig<BuildPvPCoinflipTransactionOptions<Action>>;
