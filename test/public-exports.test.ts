// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

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
import type { CoinSide as InternalCoinSide } from '../src/types/game.type.js';
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
import {
	DEFAULT_GAS_BUDGET_MIST,
	DEFAULT_LIMBO_MULTIPLIER_SCALE,
	DEFAULT_RANGE_SCALE,
	RANGE_POINT_LIMIT,
	toBigIntAmount,
	toU8Number,
} from '../src/utils/index.js';
import { describe, expect, expectTypeOf, it } from 'vitest';

import packageJson from '../package.json';

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
		expect(toBigIntAmount(1, 'stake')).toBe(1n);
		expect(toU8Number(255, 'configId')).toBe(255);
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
