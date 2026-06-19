// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag } from '@mysten/sui/utils';
import { describe, expect, it } from 'vitest';
import {
	COIN_TYPES,
	PACKAGE_IDS,
	PRICE_INFO_OBJECT_IDS,
	REGISTRY_IDS,
} from '../../src/configs/index.js';
import { PlinkoSettingsKey } from '../../src/contracts/plinko/plinko.js';
import {
	resolveCoinTypeNameForTypeNameKey,
	resolveGamePackageId,
	resolveGameSettingsKeyType,
	resolvePriceInfoObjectId,
	resolveSuigarConfig,
} from '../../src/helpers/index.js';

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
		expect(config.registryIds.pvpCoinflip).toBe(
			REGISTRY_IDS.testnet.pvpCoinflip,
		);
	});

	it('uses the selected network package map', () => {
		const config = resolveSuigarConfig('mainnet');

		expect(config.packageIds.sweetHouse).toBe(PACKAGE_IDS.mainnet.sweetHouse);
		expect(config.packageIds.range).toBe(PACKAGE_IDS.mainnet.range);
		expect(config.registryIds).toEqual(REGISTRY_IDS.mainnet);
		expect(config.priceInfoObjectIds).toEqual(PRICE_INFO_OBJECT_IDS.mainnet);
	});

	it('resolves price info object ids through supported coins', () => {
		const config = resolveSuigarConfig('testnet');
		config.priceInfoObjectIds.sui = '0xabc';

		expect(resolvePriceInfoObjectId(config, COIN_TYPES.testnet.sui)).toBe(
			'0xabc',
		);
	});

	it('maps configured coin types to supported coin object ids', () => {
		const config = resolveSuigarConfig('testnet');
		config.priceInfoObjectIds.sui = '0xsui';
		config.priceInfoObjectIds.usdc = '0xusdc';

		expect(resolvePriceInfoObjectId(config, COIN_TYPES.testnet.sui)).toBe(
			'0xsui',
		);
		expect(resolvePriceInfoObjectId(config, COIN_TYPES.testnet.usdc)).toBe(
			'0xusdc',
		);
	});

	it('resolves game package ids through the config record', () => {
		const config = resolveSuigarConfig('testnet');
		config.packageIds.range = '0x123';

		expect(resolveGamePackageId(config, 'range')).toBe('0x123');
	});

	it('builds the SweetHouse settings key type with the configured game package id', () => {
		expect(
			resolveGameSettingsKeyType(
				PlinkoSettingsKey.name,
				PACKAGE_IDS.mainnet.plinko,
			),
		).toBe(`${PACKAGE_IDS.mainnet.plinko}::plinko::PlinkoSettingsKey`);
	});

	it('keeps settings key module and struct names when replacing the package id', () => {
		expect(
			resolveGameSettingsKeyType(
				'0x123::custom_game::CustomSettingsKey',
				'0x456',
			),
		).toBe('0x456::custom_game::CustomSettingsKey');
	});

	it('formats coin types for Move TypeName dynamic field key payloads', () => {
		expect(resolveCoinTypeNameForTypeNameKey('0x2::sui::SUI')).toBe(
			'0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
		);
		expect(
			resolveCoinTypeNameForTypeNameKey(
				'47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_usdc::TEST_USDC',
			),
		).toBe(
			'47c67b9594069c32caa7a6e875ddf31d7fa52602dd22ccb9ebd8d3482aed76dc::test_usdc::TEST_USDC',
		);
	});

	it('throws when no price info object id is configured for the requested coin type', () => {
		const config = resolveSuigarConfig('testnet');

		expect(() =>
			resolvePriceInfoObjectId(config, '0x999::custom::COIN'),
		).toThrow('Unsupported coin type');
	});
});
