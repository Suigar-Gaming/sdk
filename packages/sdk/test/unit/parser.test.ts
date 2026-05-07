// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';
import { describe, expect, it } from 'vitest';
import { GAME_EVENTS } from '../../src/types/index.js';
import { parseCoinType, parseGameEvent } from '../../src/utils/index.js';

function createEvent(options: {
	eventType: string;
	module: string;
}): SuiClientTypes.Event {
	return {
		packageId:
			'0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea',
		module: options.module,
		sender:
			'0x0000000000000000000000000000000000000000000000000000000000000001',
		eventType: options.eventType,
		bcs: new Uint8Array(),
		json: null,
	};
}

describe('parseGameEvent', () => {
	it('parses standard bet result events', () => {
		expect(
			parseGameEvent(
				createEvent({
					module: 'coinflip',
					eventType:
						'0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc::core::BetResultEvent<0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea::coinflip::Game>',
				}),
			),
		).toEqual({
			gameId: 'coinflip',
			eventName: 'BetResultEvent',
		});
	});

	it('parses every supported pvp game event from GAME_EVENTS', () => {
		for (const eventName of GAME_EVENTS.filter(
			(eventName) => eventName !== 'BetResultEvent',
		)) {
			expect(
				parseGameEvent(
					createEvent({
						module: 'pvp_coinflip',
						eventType: `0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202::pvp_coinflip::${eventName}<0x2::sui::SUI>`,
					}),
				),
			).toEqual({
				gameId: 'pvp-coinflip',
				eventName,
			});
		}
	});

	it('parses every supported standard bet result game family', () => {
		for (const gameId of [
			'coinflip',
			'limbo',
			'plinko',
			'range',
			'wheel',
		] as const) {
			expect(
				parseGameEvent(
					createEvent({
						module: gameId,
						eventType: `0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc::core::BetResultEvent<0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea::${gameId}::Game>`,
					}),
				),
			).toEqual({
				gameId,
				eventName: 'BetResultEvent',
			});
		}
	});

	it('returns null when a supported event name cannot be mapped to a game id', () => {
		expect(
			parseGameEvent(
				createEvent({
					module: 'core',
					eventType:
						'0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc::core::BetResultEvent<0x1::vector::Vector>',
				}),
			),
		).toBeNull();
	});

	it('returns null for non-game event types', () => {
		expect(
			parseGameEvent(
				createEvent({
					module: 'coin',
					eventType: '0x2::coin::CoinMetadata<0x2::sui::SUI>',
				}),
			),
		).toBeNull();
	});

	it('returns null for unsupported event names even if the module looks valid', () => {
		expect(
			parseGameEvent(
				createEvent({
					module: 'coinflip',
					eventType:
						'0xb35c5f286c443752afc8ccb40125a578a4f32df35617170ccfa17fe180ab80ea::coinflip::UnexpectedEvent<0x2::sui::SUI>',
				}),
			),
		).toBeNull();
	});

	it('returns null when the generic standard game type is not a string', () => {
		expect(
			parseGameEvent(
				createEvent({
					module: 'core',
					eventType:
						'0xf391858d2a08473e8d4defcc8df89976bd7b123d3865c6b9341b237f7853dbbc::core::BetResultEvent<0x1::vector::Vector>',
				}),
			),
		).toBeNull();
	});

	it('parses a pvp event with underscore module names into kebab-case game ids', () => {
		expect(
			parseGameEvent(
				createEvent({
					module: 'pvp_coinflip',
					eventType:
						'0xb43cf6583c0c15315c7e66f173af4be79ac40c38aad1fd92ec08638ab2026202::pvp_coinflip::GameResolvedEvent<0x2::sui::SUI>',
				}),
			),
		).toEqual({
			gameId: 'pvp-coinflip',
			eventName: 'GameResolvedEvent',
		});
	});
});

describe('parseCoinType', () => {
	it('extracts the first generic type argument as the coin type', () => {
		expect(parseCoinType('0x1::pvp_coinflip::Game<0x2::sui::SUI>')).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
	});
});
