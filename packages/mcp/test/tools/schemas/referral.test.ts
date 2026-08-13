// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	buildReferralCommissionClaimTransactionInputSchema,
	getReferralCommissionInputSchema,
} from '../../../src/tools/schemas/referral.js';

describe('referral input schemas', () => {
	it('requires a referrer owner for claim reads and permits read-only claim planning', () => {
		expect(() => getReferralCommissionInputSchema.parse({})).toThrow(/expected string/u);
		expect(
			buildReferralCommissionClaimTransactionInputSchema.parse({
				mode: 'read-only',
			}),
		).toMatchObject({ mode: 'read-only' });
	});
});
