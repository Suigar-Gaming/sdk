// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export const GAMES = [
	'coinflip',
	'limbo',
	'plinko',
	'pvp-coinflip',
	'range',
	'wheel',
] as const;

export type Game = (typeof GAMES)[number];

export type StandardGame = Exclude<Game, PvPGame>;
export type PvPGame = Extract<Game, `pvp-${string}`>;

export type CoinSide = 'heads' | 'tails';

export type GameEvent =
	| 'BetResultEvent'
	| 'GameCreatedEvent'
	| 'GameResolvedEvent'
	| 'GameCancelledEvent';

export type SuigarGameEvent = {
	gameId: Game;
	eventName: GameEvent;
};
