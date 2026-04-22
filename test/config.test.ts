// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import {
	resolveGamePackageId,
	resolvePythPriceInfoObjectId,
	resolveSuigarConfig,
} from '../src/utils/config.js';
import { DEFAULT_USDC_COIN_TYPE, PACKAGE_IDS } from '../src/configs';

describe('resolveSuigarConfig', () => {
	it('resolves internal package ids and default coin types', () => {
		const config = resolveSuigarConfig('testnet');

		expect(config.coinTypes.sui).toBe(normalizeStructTag(SUI_TYPE_ARG));
		expect(config.coinTypes.usdc).toBe(
			normalizeStructTag(DEFAULT_USDC_COIN_TYPE),
		);
		expect(config.coinTypes.usdcFlowx).toBe(
			normalizeStructTag(DEFAULT_USDC_COIN_TYPE),
		);
		expect(config.gamesPackageId.coinflip).toBe(PACKAGE_IDS.testnet.coinflip);
		expect(config.gamesPackageId.wheel).toBe(PACKAGE_IDS.testnet.wheel);
		expect(config.gamesPackageId.plinko).toBe(PACKAGE_IDS.testnet.plinko);
	});

	it('uses the selected network package map', () => {
		const config = resolveSuigarConfig('mainnet');

		expect(config.sweetHousePackageId).toBe(PACKAGE_IDS.mainnet.sweetHouse);
		expect(config.gamesPackageId.range).toBe(PACKAGE_IDS.mainnet.range);
	});

	it('allows resolving explicit pyth mappings on the internal config', () => {
		const config = resolveSuigarConfig('testnet');
		config.pyth.priceInfoObjectIds[normalizeStructTag('0x2::sui::SUI')] =
			'0xabc';

		expect(resolvePythPriceInfoObjectId(config, '0x0002::sui::SUI')).toBe(
			'0xabc',
		);
	});

	it('falls back to sui and usdc price info object ids for default coin types', () => {
		const config = resolveSuigarConfig('testnet');
		config.pyth.suiPriceInfoObjectId = '0xsui';
		config.pyth.usdcPriceInfoObjectId = '0xusdc';

		expect(resolvePythPriceInfoObjectId(config, SUI_TYPE_ARG)).toBe('0xsui');
		expect(resolvePythPriceInfoObjectId(config, DEFAULT_USDC_COIN_TYPE)).toBe(
			'0xusdc',
		);
		expect(
			resolvePythPriceInfoObjectId(config, config.coinTypes.usdcFlowx),
		).toBe('0xusdc');
	});

	it('resolves game package ids through the config record', () => {
		const config = resolveSuigarConfig('testnet');
		config.gamesPackageId.range = '0x123';

		expect(resolveGamePackageId(config, 'range')).toBe('0x123');
	});

	it('throws when no pyth object id is configured for the requested coin type', () => {
		const config = resolveSuigarConfig('testnet');

		expect(() =>
			resolvePythPriceInfoObjectId(config, '0x999::custom::COIN'),
		).toThrow(
			'Missing Pyth price object configuration for coin type 0x999::custom::COIN',
		);
	});
});
