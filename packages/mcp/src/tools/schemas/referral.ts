// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { configInputSchema } from './config.js';
import {
	ADDRESS_DESCRIPTION,
	BUILDER_MODES,
	COIN_TYPE_DESCRIPTION,
	requireTransactionFields,
} from './shared.js';

const referralClaimInputSchema = configInputSchema
	.extend({
		mode: z
			.enum(BUILDER_MODES)
			.default('build')
			.describe('Build, dry-run, or return a read-only plan.'),
		owner: z.string().min(1).optional().describe(ADDRESS_DESCRIPTION),
		gasBudget: z.number().int().positive().optional().describe('Optional gas budget in MIST.'),
	})
	.strict();

export const getReferralCommissionInputSchema = configInputSchema
	.extend({
		owner: z.string().min(1).describe(ADDRESS_DESCRIPTION),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
	})
	.strict();

export const getReferralLevelUpUsdRewardsInputSchema = configInputSchema
	.extend({
		owner: z.string().min(1).describe(ADDRESS_DESCRIPTION),
	})
	.strict();

export const buildReferralCommissionClaimTransactionInputSchema = referralClaimInputSchema
	.extend({
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
	})
	.strict()
	.superRefine((input, context) => requireTransactionFields(input, context, ['owner']));

export const buildReferralLevelUpUsdRewardsClaimTransactionInputSchema = referralClaimInputSchema
	.strict()
	.superRefine((input, context) => requireTransactionFields(input, context, ['owner']));

export type GetReferralCommissionInput = z.input<typeof getReferralCommissionInputSchema>;
export type GetReferralLevelUpUsdRewardsInput = z.input<
	typeof getReferralLevelUpUsdRewardsInputSchema
>;
export type BuildReferralCommissionClaimTransactionInput = z.input<
	typeof buildReferralCommissionClaimTransactionInputSchema
>;
export type BuildReferralLevelUpUsdRewardsClaimTransactionInput = z.input<
	typeof buildReferralLevelUpUsdRewardsClaimTransactionInputSchema
>;
