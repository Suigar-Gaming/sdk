// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { InferBcsType } from '@mysten/bcs';
import type { BetResultEvent } from '../contracts/core/core.js';
import type {
	GameCancelledEvent,
	GameCreatedEvent,
	GameResolvedEvent,
} from '../contracts/pvp-coinflip/pvp_coinflip.js';
import type { GameDetails } from './game-details.type.js';
import type { Game } from './game.type.js';

export type BetResultEventData = InferBcsType<typeof BetResultEvent>;
export type PvPCoinflipGameCreatedEventData = InferBcsType<typeof GameCreatedEvent>;
export type PvPCoinflipGameResolvedEventData = InferBcsType<typeof GameResolvedEvent>;
export type PvPCoinflipGameCancelledEventData = InferBcsType<typeof GameCancelledEvent>;

export type BetResultSuigarEvent<TGame extends Game = Game> = TGame extends Game
	? {
			game: TGame;
			event: {
				type: 'BetResultEvent';
				data: BetResultEventData;
			};
			gameDetails: GameDetails<TGame>;
		}
	: never;

export type SuigarEvent =
	| BetResultSuigarEvent<Game>
	| {
			game: 'pvp-coinflip';
			event: {
				type: 'GameCreatedEvent';
				data: PvPCoinflipGameCreatedEventData;
			};
	  }
	| {
			game: 'pvp-coinflip';
			event: {
				type: 'GameResolvedEvent';
				data: PvPCoinflipGameResolvedEventData;
			};
	  }
	| {
			game: 'pvp-coinflip';
			event: {
				type: 'GameCancelledEvent';
				data: PvPCoinflipGameCancelledEventData;
			};
	  };
