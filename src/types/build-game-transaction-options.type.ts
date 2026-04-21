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

export type BuildGameOptions<GameId extends StandardGame> =
	GameId extends 'coinflip'
		? BuildCoinflipTransactionOptions
		: GameId extends 'wheel'
			? BuildWheelTransactionOptions
			: GameId extends 'limbo'
				? BuildLimboTransactionOptions
				: GameId extends 'plinko'
					? BuildPlinkoTransactionOptions
					: GameId extends 'range'
						? BuildRangeTransactionOptions
						: never;

export type BuildPvPGameOptions<Action extends PvPCoinflipAction> =
	BuildPvPCoinflipTransactionOptions<Action>;
