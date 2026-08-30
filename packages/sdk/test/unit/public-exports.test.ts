// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, expectTypeOf, it } from 'vitest';
import packageJson from '../../package.json' with { type: 'json' };
import type {
	CancelPvPCoinflipTransactionOptions,
	CoinflipTransactionOptions,
	CoinSide,
	CreateGameBetOptions,
	CreatePvPCoinflipTransactionOptions,
	Game,
	JoinPvPCoinflipTransactionOptions,
	LimboTransactionOptions,
	PlinkoTransactionOptions,
	PvPCoinflipAction,
	PvPGame,
	RangeTransactionOptions,
	SoccerTransactionOptions,
	StandardGame,
	WheelTransactionOptions,
} from '../../src/games.js';
import type { CreateGameBetOptions as InternalCreateGameBetOptions } from '../../src/types/game-options.type.js';
import type {
	CoinSide as InternalCoinSide,
	Game as InternalGame,
	PvPCoinflipAction as InternalPvPCoinflipAction,
	PvPGame as InternalPvPGame,
	StandardGame as InternalStandardGame,
} from '../../src/types/game.type.js';
import type {
	CancelPvPCoinflipTransactionOptions as InternalCancelPvPCoinflipTransactionOptions,
	CoinflipTransactionOptions as InternalCoinflipTransactionOptions,
	CreatePvPCoinflipTransactionOptions as InternalCreatePvPCoinflipTransactionOptions,
	JoinPvPCoinflipTransactionOptions as InternalJoinPvPCoinflipTransactionOptions,
	LimboTransactionOptions as InternalLimboTransactionOptions,
	PlinkoTransactionOptions as InternalPlinkoTransactionOptions,
	RangeTransactionOptions as InternalRangeTransactionOptions,
	SoccerTransactionOptions as InternalSoccerTransactionOptions,
	WheelTransactionOptions as InternalWheelTransactionOptions,
} from '../../src/types/transaction-options.type.js';
import {
	DEFAULT_GAS_BUDGET_MIST,
	DEFAULT_LIMBO_MULTIPLIER_SCALE,
	DEFAULT_RANGE_SCALE,
	fromMoveFloat,
	fromMoveI64,
	isMoveFloat,
	isMoveI64,
	parseCoinType,
	parseGameEvent,
	RANGE_POINT_LIMIT,
	toBigInt,
	toU8,
	toU16,
	toU32,
} from '../../src/utils/index.js';

describe('public source subpath modules', () => {
	it('loads the package root module', async () => {
		const module = await import('../../src/index.js');

		expect(module).toBeDefined();
		expect(module.SUPPORTED_SUI_NETWORKS).toEqual(['mainnet', 'testnet']);
	});

	it('loads the games subpath module', async () => {
		const module = await import('../../src/games.js');

		expect(module).toBeDefined();
		expect(Object.keys(module)).toEqual(['GAMES']);
		expect(module.GAMES).toEqual([
			'coinflip',
			'keno',
			'limbo',
			'plinko',
			'pvp-coinflip',
			'range',
			'soccer',
			'wheel',
		]);
	});

	it('loads the utils subpath module', async () => {
		const module = await import('../../src/utils/index.js');

		expect(module).toBeDefined();
		expect(DEFAULT_GAS_BUDGET_MIST).toBeTypeOf('bigint');
		expect(DEFAULT_GAS_BUDGET_MIST).toBe(50_000_000n);
		expect(RANGE_POINT_LIMIT).toBe(100_000_000);
		expect(DEFAULT_RANGE_SCALE).toBe(1_000_000);
		expect(DEFAULT_LIMBO_MULTIPLIER_SCALE).toBe(100);
		expect(fromMoveI64({ bits: '0' })).toBe(0);
		expect(isMoveI64({ bits: '0' })).toBe(true);
		expect(isMoveI64({ bits: 0 })).toBe(false);
		expect(fromMoveFloat({ mant: '0', exp: { bits: '0' }, is_negative: false })).toBe(0);
		expect(isMoveFloat({ mant: '0', exp: { bits: '0' }, is_negative: false })).toBe(true);
		expect(isMoveFloat({ mant: '0', exp: { bits: 0 }, is_negative: false })).toBe(false);
		expect(parseGameEvent).toBeTypeOf('function');
		expect(parseCoinType('0x1::pvp_coinflip::Game<0x2::sui::SUI>')).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
		expect(toBigInt(1)).toBe(1n);
		expect(toBigInt('1')).toBe(1n);
		expect(toBigInt(true)).toBe(1n);
		expect(toU8(255)).toBe(255);
		expect(toU8('1')).toBe(1);
		expect(toU16(65_535)).toBe(65_535);
		expect(toU16('1')).toBe(1);
		expect(toU32(4_294_967_295)).toBe(4_294_967_295);
		expect(toU32('1')).toBe(1);
	});

	it('exposes only the intended package subpaths', () => {
		expect(Object.keys(packageJson.exports).sort()).toEqual(['.', './games', './utils']);

		expect(packageJson.exports['./games']).toEqual({
			types: './dist/games.d.mts',
			import: './dist/games.mjs',
			default: './dist/games.mjs',
		});
	});

	it('re-exports the expected public game types', () => {
		expectTypeOf<CoinSide>().toEqualTypeOf<InternalCoinSide>();
		expectTypeOf<Game>().toEqualTypeOf<InternalGame>();
		expectTypeOf<StandardGame>().toEqualTypeOf<InternalStandardGame>();
		expectTypeOf<PvPGame>().toEqualTypeOf<InternalPvPGame>();
		expectTypeOf<PvPCoinflipAction>().toEqualTypeOf<InternalPvPCoinflipAction>();
		expectTypeOf<CreateGameBetOptions<'coinflip'>>().toEqualTypeOf<
			InternalCreateGameBetOptions<'coinflip'>
		>();
		expectTypeOf<CoinflipTransactionOptions>().toEqualTypeOf<InternalCoinflipTransactionOptions>();
		expectTypeOf<LimboTransactionOptions>().toEqualTypeOf<InternalLimboTransactionOptions>();
		expectTypeOf<PlinkoTransactionOptions>().toEqualTypeOf<InternalPlinkoTransactionOptions>();
		expectTypeOf<RangeTransactionOptions>().toEqualTypeOf<InternalRangeTransactionOptions>();
		expectTypeOf<SoccerTransactionOptions>().toEqualTypeOf<InternalSoccerTransactionOptions>();
		expectTypeOf<WheelTransactionOptions>().toEqualTypeOf<InternalWheelTransactionOptions>();
		expectTypeOf<CreatePvPCoinflipTransactionOptions>().toEqualTypeOf<InternalCreatePvPCoinflipTransactionOptions>();
		expectTypeOf<JoinPvPCoinflipTransactionOptions>().toEqualTypeOf<InternalJoinPvPCoinflipTransactionOptions>();
		expectTypeOf<CancelPvPCoinflipTransactionOptions>().toEqualTypeOf<InternalCancelPvPCoinflipTransactionOptions>();
	});
});
