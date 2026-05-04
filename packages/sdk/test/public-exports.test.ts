// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, expectTypeOf, it } from 'vitest';
import packageJson from '../package.json';
import type {
	BuildCancelPvPCoinflipTransactionOptions,
	BuildCoinflipTransactionOptions,
	BuildCreatePvPCoinflipTransactionOptions,
	BuildJoinPvPCoinflipTransactionOptions,
	BuildLimboTransactionOptions,
	BuildPlinkoTransactionOptions,
	BuildRangeTransactionOptions,
	BuildWheelTransactionOptions,
	CoinSide,
	PvPCoinflipAction,
} from '../src/games.js';
import type { CoinSide as InternalCoinSide } from '../src/types/game.type.js';
import type {
	BuildCancelPvPCoinflipTransactionOptions as InternalBuildCancelPvPCoinflipTransactionOptions,
	BuildCoinflipTransactionOptions as InternalBuildCoinflipTransactionOptions,
	BuildCreatePvPCoinflipTransactionOptions as InternalBuildCreatePvPCoinflipTransactionOptions,
	BuildJoinPvPCoinflipTransactionOptions as InternalBuildJoinPvPCoinflipTransactionOptions,
	BuildLimboTransactionOptions as InternalBuildLimboTransactionOptions,
	BuildPlinkoTransactionOptions as InternalBuildPlinkoTransactionOptions,
	BuildRangeTransactionOptions as InternalBuildRangeTransactionOptions,
	BuildWheelTransactionOptions as InternalBuildWheelTransactionOptions,
	PvPCoinflipAction as InternalPvPCoinflipAction,
} from '../src/types/transaction-options.type.js';
import {
	DEFAULT_GAS_BUDGET_MIST,
	DEFAULT_LIMBO_MULTIPLIER_SCALE,
	DEFAULT_RANGE_SCALE,
	fromMoveFloat,
	fromMoveI64,
	parseCoinType,
	RANGE_POINT_LIMIT,
	toBigInt,
	toU8,
} from '../src/utils/index.js';

describe('public source subpath modules', () => {
	it('loads the games subpath module', async () => {
		const module = await import('../src/games.js');

		expect(module).toBeDefined();
		expect(Object.keys(module)).toEqual([]);
	});

	it('loads the utils subpath module', async () => {
		const module = await import('../src/utils/index.js');

		expect(module).toBeDefined();
		expect(DEFAULT_GAS_BUDGET_MIST).toBeTypeOf('bigint');
		expect(DEFAULT_GAS_BUDGET_MIST).toBe(50_000_000n);
		expect(RANGE_POINT_LIMIT).toBe(100_000_000);
		expect(DEFAULT_RANGE_SCALE).toBe(1_000_000);
		expect(DEFAULT_LIMBO_MULTIPLIER_SCALE).toBe(100);
		expect(fromMoveI64({ bits: '0' })).toBe(0);
		expect(
			fromMoveFloat({ mant: '0', exp: { bits: '0' }, is_negative: false }),
		).toBe(0);
		expect(parseCoinType('0x1::pvp_coinflip::Game<0x2::sui::SUI>')).toBe(
			'0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
		expect(toBigInt(1)).toBe(1n);
		expect(toBigInt('1')).toBe(1n);
		expect(toBigInt(true)).toBe(1n);
		expect(toU8(255)).toBe(255);
	});

	it('exposes only the intended package subpaths', () => {
		expect(Object.keys(packageJson.exports).sort()).toEqual([
			'.',
			'./games',
			'./utils',
		]);

		expect(packageJson.exports['./games']).toEqual({
			types: './dist/games.d.ts',
			import: './dist/games.js',
			require: './dist/games.cjs',
		});
	});

	it('re-exports the expected public game types', () => {
		expectTypeOf<CoinSide>().toEqualTypeOf<InternalCoinSide>();
		expectTypeOf<PvPCoinflipAction>().toEqualTypeOf<InternalPvPCoinflipAction>();
		expectTypeOf<BuildCoinflipTransactionOptions>().toEqualTypeOf<InternalBuildCoinflipTransactionOptions>();
		expectTypeOf<BuildLimboTransactionOptions>().toEqualTypeOf<InternalBuildLimboTransactionOptions>();
		expectTypeOf<BuildPlinkoTransactionOptions>().toEqualTypeOf<InternalBuildPlinkoTransactionOptions>();
		expectTypeOf<BuildRangeTransactionOptions>().toEqualTypeOf<InternalBuildRangeTransactionOptions>();
		expectTypeOf<BuildWheelTransactionOptions>().toEqualTypeOf<InternalBuildWheelTransactionOptions>();
		expectTypeOf<BuildCreatePvPCoinflipTransactionOptions>().toEqualTypeOf<InternalBuildCreatePvPCoinflipTransactionOptions>();
		expectTypeOf<BuildJoinPvPCoinflipTransactionOptions>().toEqualTypeOf<InternalBuildJoinPvPCoinflipTransactionOptions>();
		expectTypeOf<BuildCancelPvPCoinflipTransactionOptions>().toEqualTypeOf<InternalBuildCancelPvPCoinflipTransactionOptions>();
	});
});
