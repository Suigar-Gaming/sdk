// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	normalizeStructTag,
	SUI_DECIMALS,
	SUI_TYPE_ARG,
} from '@mysten/sui/utils';
import { describe, expect, it } from 'vitest';
import {
	COINS,
	PACKAGE_IDS,
	PRICE_INFO_OBJECT_IDS,
	REGISTRY_IDS,
} from '../../src/configs/index.js';
import { TypeName } from '../../src/contracts/core/deps/0x0000000000000000000000000000000000000000000000000000000000000001/type_name.js';
import {
	Parameters as PlinkoParameters,
	PlinkoSettingsKey,
} from '../../src/contracts/plinko/plinko.js';
import {
	resolveGamePackageId,
	resolvePriceInfoObjectId,
	resolveSuigarConfig,
} from '../../src/helpers/index.js';

describe('resolveSuigarConfig', () => {
	it('resolves internal package ids and default coin types', () => {
		const config = resolveSuigarConfig('testnet');

		expect(config.coins.sui).toEqual({
			coinType: normalizeStructTag(COINS.testnet.sui.coinType),
			decimals: 9,
		});
		expect(config.coins.usdc).toEqual({
			coinType: normalizeStructTag(COINS.testnet.usdc.coinType),
			decimals: 6,
		});
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
		expect(config.coins.sui).toEqual({
			coinType: normalizeStructTag(SUI_TYPE_ARG),
			decimals: SUI_DECIMALS,
		});
	});

	it('resolves price info object ids through supported coins', () => {
		const config = resolveSuigarConfig('testnet');
		config.priceInfoObjectIds.sui = '0xabc';

		expect(resolvePriceInfoObjectId(config, COINS.testnet.sui.coinType)).toBe(
			'0xabc',
		);
	});

	it('maps configured coins to supported coin object ids', () => {
		const config = resolveSuigarConfig('testnet');
		config.priceInfoObjectIds.sui = '0xsui';
		config.priceInfoObjectIds.usdc = '0xusdc';

		expect(resolvePriceInfoObjectId(config, COINS.testnet.sui.coinType)).toBe(
			'0xsui',
		);
		expect(resolvePriceInfoObjectId(config, COINS.testnet.usdc.coinType)).toBe(
			'0xusdc',
		);
	});

	it('applies network config overrides for supported coins', () => {
		const config = resolveSuigarConfig('testnet', {
			packageIds: {
				range: '0xoverride',
			},
			coins: {
				sui: {
					coinType: '0x2::sui::SUI',
					decimals: SUI_DECIMALS,
				},
				usdc: {
					coinType: '0x999::usdc::USDC',
					decimals: 4,
				},
			},
			priceInfoObjectIds: {
				usdc: '0xprice',
			},
		});

		expect(config.packageIds.range).toBe('0xoverride');
		expect(config.coins.sui).toEqual({
			coinType: normalizeStructTag(SUI_TYPE_ARG),
			decimals: SUI_DECIMALS,
		});
		expect(config.coins.usdc).toEqual({
			coinType: normalizeStructTag('0x999::usdc::USDC'),
			decimals: 4,
		});
		expect(resolvePriceInfoObjectId(config, '0x999::usdc::USDC')).toBe(
			'0xprice',
		);
	});

	it('resolves game package ids through the config record', () => {
		const config = resolveSuigarConfig('testnet');
		config.packageIds.range = '0x123';

		expect(resolveGamePackageId(config, 'range')).toBe('0x123');
	});

	it('builds the SweetHouse settings key type with the generated typeTag helper', () => {
		expect(
			PlinkoSettingsKey.typeTag({ package: PACKAGE_IDS.mainnet.plinko }),
		).toBe(`${PACKAGE_IDS.mainnet.plinko}::plinko::PlinkoSettingsKey`);
	});

	it('supports generated type tags with positional type arguments', () => {
		expect(
			PlinkoParameters.typeTag({
				package: '0x456',
				typeArguments: [SUI_TYPE_ARG],
			}),
		).toBe(`0x456::plinko::Parameters<${normalizeStructTag(SUI_TYPE_ARG)}>`);
	});

	it('builds generated TypeName tags independently from TypeName key values', () => {
		expect(TypeName.typeTag()).toBe(normalizeStructTag(TypeName.name));
	});

	it('throws when no price info object id is configured for the requested coin type', () => {
		const config = resolveSuigarConfig('testnet');

		expect(() =>
			resolvePriceInfoObjectId(config, '0x999::custom::COIN'),
		).toThrow('Unsupported coin type');
	});
});
