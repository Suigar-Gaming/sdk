// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Game } from './game.type';

export type GameEvent =
	| 'BetResultEvent'
	| 'GameCreatedEvent'
	| 'GameResolvedEvent'
	| 'GameCancelledEvent';

export type SuigarEvent = {
	gameId: Game;
	eventName: GameEvent;
};
