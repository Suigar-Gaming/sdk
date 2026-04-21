// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import {
	resolveGamePackageId,
	resolvePythPriceInfoObjectId,
	resolveSuigarConfig,
} from '../src/utils/config.js';
import {
	DEFAULT_GAMES_PACKAGE_ID,
	DEFAULT_USDC_COIN_TYPE,
	DEFAULT_USDC_FLOWX_COIN_TYPE,
} from '../src/configs';

describe('resolveSuigarConfig', () => {
	it('resolves direct overrides for game package ids and coin types', () => {
		const config = resolveSuigarConfig({
			coinTypes: {
				sui: '0x2::sui::SUI',
				usdc: '0x123::usdc::USDC',
			},
			gamesPackageId: {
				coinflip: '0x2',
				wheel: '0x3',
			},
		});

		expect(config.coinTypes.sui).toBe(normalizeStructTag(SUI_TYPE_ARG));
		expect(config.coinTypes.usdc).toBe(normalizeStructTag('0x123::usdc::USDC'));
		expect(config.coinTypes.usdcFlowx).toBe(
			normalizeStructTag(DEFAULT_USDC_FLOWX_COIN_TYPE),
		);
		expect(config.gamesPackageId.coinflip).toBe('0x2');
		expect(config.gamesPackageId.wheel).toBe('0x3');
		expect(config.gamesPackageId.plinko).toBe(DEFAULT_GAMES_PACKAGE_ID.plinko);
	});

	it('normalizes explicit pyth mapping by coin type', () => {
		const config = resolveSuigarConfig({
			pyth: {
				priceInfoObjectIds: {
					'0x2::sui::SUI': '0xabc',
				},
			},
		});

		expect(resolvePythPriceInfoObjectId(config, '0x0002::sui::SUI')).toBe(
			'0xabc',
		);
	});

	it('accepts sweetHouse package id overrides from user options', () => {
		const config = resolveSuigarConfig({
			sweetHousePackageId: '0x123',
		});

		expect(config.sweetHousePackageId).toBe('0x123');
	});

	it('falls back to sui and usdc price info object ids for default coin types', () => {
		const config = resolveSuigarConfig({
			pyth: {
				suiPriceInfoObjectId: '0xsui',
				usdcPriceInfoObjectId: '0xusdc',
			},
		});

		expect(resolvePythPriceInfoObjectId(config, SUI_TYPE_ARG)).toBe('0xsui');
		expect(resolvePythPriceInfoObjectId(config, DEFAULT_USDC_COIN_TYPE)).toBe(
			'0xusdc',
		);
		expect(
			resolvePythPriceInfoObjectId(config, DEFAULT_USDC_FLOWX_COIN_TYPE),
		).toBe('0xusdc');
	});

	it('resolves game package ids through the config record', () => {
		const config = resolveSuigarConfig({
			gamesPackageId: {
				range: '0x123',
			},
		});

		expect(resolveGamePackageId(config, 'range')).toBe('0x123');
	});

	it('throws when no pyth object id is configured for the requested coin type', () => {
		const config = resolveSuigarConfig({});

		expect(() =>
			resolvePythPriceInfoObjectId(config, '0x999::custom::COIN'),
		).toThrow(
			'Missing Pyth price object configuration for coin type 0x999::custom::COIN',
		);
	});
});
