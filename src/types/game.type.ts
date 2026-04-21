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
export type PvPGame = 'pvp-coinflip';

export type CoinSide = 'heads' | 'tails';
