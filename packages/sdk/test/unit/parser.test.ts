// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';
import { describe, expect, expectTypeOf, it } from 'vitest';
import { BetResultGameDetails, GAME_EVENTS } from '../../src/types/index.js';
import {
	parseCoinType,
	parseGameDetails,
	parseGameEvent,
} from '../../src/utils/index.js';
import { encodeFloat, encodeString, writeU64 } from './utils.js';

function gameDetails(
	contents: Array<{ key: string; value: number[] }>,
): BetResultGameDetails {
	return { contents };
}

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
	it('extracts and normalizes the first generic coin type', () => {
		expect(parseCoinType('0x1::pvp_coinflip::Game<0x2::sui::SUI>')).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
		expect(
			parseCoinType(
				'0x1::pvp_coinflip::Game<0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>',
			),
		).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
	});

	it('throws when the object type does not include a generic coin type', () => {
		expect(() => parseCoinType('0x1::pvp_coinflip::Game')).toThrow(
			'Unable to parse coin type',
		);
	});
});

describe('parseGameDetails', () => {
	it('parses known detail types and preserves unknown event keys', () => {
		expect(
			parseGameDetails(
				'coinflip',
				gameDetails([
					{ key: 'player_bet', value: encodeString('heads') },
					{ key: 'coin_outcome', value: encodeString('tails') },
					{ key: 'custom_label', value: encodeString('vip') },
				]),
			),
		).toEqual({
			player_bet: 'heads',
			coin_outcome: 'tails',
			custom_label: 'vip',
		});
	});

	it('decodes numeric, boolean, float, and raw UTF-8 values', () => {
		const rangeDetails = parseGameDetails(
			'range',
			gameDetails([
				{ key: 'roll_value', value: writeU64(42n) },
				{ key: 'win', value: [1] },
				{ key: 'range_mode', value: [2] },
				{ key: 'payout_multiplier', value: encodeFloat(2.5) },
				{ key: 'actual_rtp', value: encodeFloat(0.97) },
			]),
		);

		expect(rangeDetails).toMatchObject({
			roll_value: 42,
			win: true,
			range_mode: 2,
			payout_multiplier: 2.5,
		});
		expect(Number(rangeDetails.actual_rtp)).toBeCloseTo(0.97);
		expect(
			parseGameDetails(
				'pvp-coinflip',
				gameDetails([{ key: 'pvp_result', value: [108, 111, 115, 115] }]),
			),
		).toEqual({ pvp_result: 'loss' });
	});

	it('narrows parsed detail keys and value types by game id', () => {
		const details = parseGameDetails(
			'coinflip',
			gameDetails([
				{ key: 'player_bet', value: encodeString('heads') },
				{ key: 'coin_outcome', value: encodeString('tails') },
			]),
		);

		expectTypeOf(details).toEqualTypeOf<{
			player_bet: string;
			coin_outcome: string;
		}>();
	});
});
