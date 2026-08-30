// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { configInputSchema } from './config.js';
import {
	ADDRESS_DESCRIPTION,
	BUILDER_MODES,
	COIN_TYPE_DESCRIPTION,
	CURRENCY_AMOUNT_DESCRIPTION,
	currencyAmountSchema,
} from './shared.js';

const sweethouseBuildInputSchema = configInputSchema
	.extend({
		mode: z
			.enum(BUILDER_MODES)
			.default('build')
			.describe('Build, dry-run, or return a read-only plan.'),
		owner: z.string().min(1).optional().describe(ADDRESS_DESCRIPTION),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
		gasBudget: z.number().int().positive().optional().describe('Optional gas budget in MIST.'),
		executionWallet: z
			.enum(['connected', 'session'])
			.default('connected')
			.describe(
				'For execute mode, use connected for browser approval or session to sign and submit with the local session wallet.',
			),
		sessionWalletId: z
			.uuid()
			.optional()
			.describe('Named local session wallet used when executionWallet is session.'),
	})
	.strict();

export const buildSweetHouseDepositTransactionInputSchema = sweethouseBuildInputSchema
	.extend({
		amount: currencyAmountSchema
			.optional()
			.describe(`Deposit amount. ${CURRENCY_AMOUNT_DESCRIPTION}`),
		useGasCoin: z
			.boolean()
			.optional()
			.describe('Allow the SUI gas coin to be used for native SUI deposits.'),
	})
	.strict();

export const buildSweetHouseRedeemRequestTransactionInputSchema = sweethouseBuildInputSchema
	.extend({
		amount: currencyAmountSchema
			.optional()
			.describe(
				`Staked coin amount for the selected SweetHouse pool. ${CURRENCY_AMOUNT_DESCRIPTION}`,
			),
	})
	.strict();

export const buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInputSchema =
	sweethouseBuildInputSchema
		.extend({
			requestId: z.string().min(1).optional().describe('SweetHouse redeem request id.'),
		})
		.strict();

export type BuildSweetHouseDepositTransactionInput = z.input<
	typeof buildSweetHouseDepositTransactionInputSchema
>;
export type BuildSweetHouseRedeemRequestTransactionInput = z.input<
	typeof buildSweetHouseRedeemRequestTransactionInputSchema
>;
export type BuildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInput = z.input<
	typeof buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInputSchema
>;
