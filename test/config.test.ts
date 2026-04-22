// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { normalizeStructTag, SUI_TYPE_ARG } from '@mysten/sui/utils';

import {
	resolveGamePackageId,
	resolvePriceInfoObjectId,
	resolveSuigarConfig,
} from '../src/utils/config.js';
import { COIN_TYPES, PACKAGE_IDS, PRICE_INFO_OBJECT_IDS } from '../src/configs';

describe('resolveSuigarConfig', () => {
	it('resolves internal package ids and default coin types', () => {
		const config = resolveSuigarConfig('testnet');

		expect(config.coinTypes.sui).toBe(
			normalizeStructTag(COIN_TYPES.testnet.sui),
		);
		expect(config.coinTypes.usdc).toBe(
			normalizeStructTag(COIN_TYPES.testnet.usdc),
		);
		expect(config.packageIds.coinflip).toBe(PACKAGE_IDS.testnet.coinflip);
		expect(config.packageIds.wheel).toBe(PACKAGE_IDS.testnet.wheel);
		expect(config.packageIds.plinko).toBe(PACKAGE_IDS.testnet.plinko);
	});

	it('uses the selected network package map', () => {
		const config = resolveSuigarConfig('mainnet');

		expect(config.packageIds.sweetHouse).toBe(PACKAGE_IDS.mainnet.sweetHouse);
		expect(config.packageIds.range).toBe(PACKAGE_IDS.mainnet.range);
		expect(config.priceInfoObjectIds).toEqual(PRICE_INFO_OBJECT_IDS.mainnet);
	});

	it('resolves price info object ids through supported coins', () => {
		const config = resolveSuigarConfig('testnet');
		config.priceInfoObjectIds.sui = '0xabc';

		expect(resolvePriceInfoObjectId(config, '0x0002::sui::SUI')).toBe('0xabc');
	});

	it('maps configured coin types to supported coin object ids', () => {
		const config = resolveSuigarConfig('testnet');
		config.priceInfoObjectIds.sui = '0xsui';
		config.priceInfoObjectIds.usdc = '0xusdc';

		expect(resolvePriceInfoObjectId(config, SUI_TYPE_ARG)).toBe('0xsui');
		expect(resolvePriceInfoObjectId(config, COIN_TYPES.testnet.usdc)).toBe(
			'0xusdc',
		);
	});

	it('resolves game package ids through the config record', () => {
		const config = resolveSuigarConfig('testnet');
		config.packageIds.range = '0x123';

		expect(resolveGamePackageId(config, 'range')).toBe('0x123');
	});

	it('throws when no price info object id is configured for the requested coin type', () => {
		const config = resolveSuigarConfig('testnet');

		expect(() =>
			resolvePriceInfoObjectId(config, '0x999::custom::COIN'),
		).toThrow('Unsupported coin type');
	});
});
