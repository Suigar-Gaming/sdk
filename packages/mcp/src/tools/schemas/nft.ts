// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { configInputSchema } from './config.js';
import { ADDRESS_DESCRIPTION, BUILDER_MODES } from './shared.js';

export const buildNftV1MintTransactionInputSchema = configInputSchema
	.extend({
		mode: z
			.enum(BUILDER_MODES)
			.default('build')
			.describe('Build, dry-run, or return a read-only plan.'),
		owner: z.string().min(1).optional().describe(ADDRESS_DESCRIPTION),
		specId: z.string().min(1).optional().describe('NFT V1 specification id.'),
		gasBudget: z.number().int().positive().optional().describe('Optional gas budget in MIST.'),
		useGasCoin: z
			.boolean()
			.optional()
			.describe('Allow the SUI gas coin to be used for the NFT payment.'),
	})
	.strict();

export type BuildNftV1MintTransactionInput = z.input<typeof buildNftV1MintTransactionInputSchema>;
