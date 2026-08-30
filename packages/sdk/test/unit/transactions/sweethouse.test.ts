// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { describe, expect, it } from 'vitest';
import {
	buildClaimOwnSweetHouseRedeemRequestAfterDelayTransaction,
	buildDepositSweetHouseTransaction,
	buildRedeemSweetHouseRequestTransaction,
} from '../../../src/transactions/sweethouse.js';
import { TEST_CONFIG } from '../../utils.js';
import './utils.js';

const SWEETHOUSE_CONFIG = {
	...TEST_CONFIG,
	packageIds: {
		...TEST_CONFIG.packageIds,
		core: '0x111',
	},
	objectIds: {
		...TEST_CONFIG.objectIds,
		sweetHouse: '0x222',
	},
};

describe('SweetHouse transaction builder', () => {
	it('builds a public pool deposit and transfers returned hTokens to the owner', () => {
		const tx = buildDepositSweetHouseTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			amount: 1_000,
			useGasCoin: false,
			config: SWEETHOUSE_CONFIG,
		});
		const data = tx.getData();
		const depositCall = data.commands[1].MoveCall!;

		expect(data.sender).toBe(normalizeSuiAddress('0x123'));
		expect(data.commands[0].$kind).toBe('$Intent');
		expect(depositCall.package).toBe(normalizeSuiAddress(SWEETHOUSE_CONFIG.packageIds.core));
		expect(depositCall.module).toBe('sweethouse');
		expect(depositCall.function).toBe('deposit_public_pool_and_mint_staked_coins');
		expect(depositCall.typeArguments).toEqual([normalizeStructTag('0x2::sui::SUI')]);
		expect(depositCall.arguments).toHaveLength(2);
		expect(data.commands[2].TransferObjects).toBeDefined();
	});

	it('builds a redeem request with the hToken coin and Clock', () => {
		const tx = buildRedeemSweetHouseRequestTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			hTokenCoinId: '0x333',
			config: SWEETHOUSE_CONFIG,
		});
		const call = tx.getData().commands[0].MoveCall!;

		expect(call.package).toBe(normalizeSuiAddress(SWEETHOUSE_CONFIG.packageIds.core));
		expect(call.module).toBe('sweethouse');
		expect(call.function).toBe('redeem_request');
		expect(call.typeArguments).toEqual([normalizeStructTag('0x2::sui::SUI')]);
		expect(call.arguments).toHaveLength(3);
	});

	it('builds a delayed own redeem request claim with the request id and Clock', () => {
		const tx = buildClaimOwnSweetHouseRedeemRequestAfterDelayTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			requestId: '0x444',
			config: SWEETHOUSE_CONFIG,
		});
		const call = tx.getData().commands[0].MoveCall!;

		expect(call.package).toBe(normalizeSuiAddress(SWEETHOUSE_CONFIG.packageIds.core));
		expect(call.module).toBe('sweethouse');
		expect(call.function).toBe('claim_own_redeem_request_after_delay');
		expect(call.typeArguments).toEqual([normalizeStructTag('0x2::sui::SUI')]);
		expect(call.arguments).toHaveLength(3);
	});
});
