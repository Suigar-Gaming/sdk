// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export const GAMES = [
	'coinflip',
	'limbo',
	'plinko',
	'pvp-coinflip',
	'range',
	'soccer',
	'wheel',
] as const;

export const GAME_EVENTS = [
	'BetResultEvent',
	'GameCreatedEvent',
	'GameResolvedEvent',
	'GameCancelledEvent',
] as const;

export type Game = (typeof GAMES)[number];

export type StandardGame = Exclude<Game, PvPGame>;
export type PvPGame = Extract<Game, `pvp-${string}`>;

export type CoinSide = 'heads' | 'tails';
export type PvPCoinflipAction = 'create' | 'join' | 'cancel';

export type GameEvent = (typeof GAME_EVENTS)[number];

/**
 * A supported Suigar game event.
 *
 * Standard games emit only `BetResultEvent`, while PvP game modules can emit every event in `GAME_EVENTS`.
 */
export type SuigarGameEvent =
	| {
			gameId: StandardGame;
			eventName: 'BetResultEvent';
	  }
	| {
			gameId: PvPGame;
			eventName: GameEvent;
	  };
