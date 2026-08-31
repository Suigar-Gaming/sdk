// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInputSchema,
	buildSweetHouseDepositTransactionInputSchema,
} from '../../../src/tools/schemas/sweethouse.js';

const owner = '0x0000000000000000000000000000000000000000000000000000000000000001';
const requestId = '0x0000000000000000000000000000000000000000000000000000000000000002';

describe('SweetHouse input schemas', () => {
	it('requires deposit amount unless read-only planning is requested', () => {
		expect(buildSweetHouseDepositTransactionInputSchema.parse({ mode: 'read-only' }).mode).toBe(
			'read-only',
		);
		expect(() => buildSweetHouseDepositTransactionInputSchema.parse({ owner })).toThrow(
			/amount is required/u,
		);
	});

	it('requires delayed claim request id and validates it as a Sui object id', () => {
		expect(
			buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInputSchema.parse({
				owner,
				requestId,
			}),
		).toMatchObject({ requestId });
		expect(() =>
			buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInputSchema.parse({
				owner,
				requestId: '0x123',
			}),
		).toThrow(/valid Sui object id/u);
		expect(() =>
			buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInputSchema.parse({ owner }),
		).toThrow(/requestId is required/u);
	});
});
