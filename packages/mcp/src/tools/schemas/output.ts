// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { SUPPORTED_SUI_NETWORKS } from '@suigar/sdk';
import { BUILDER_MODES } from './shared.js';

const unknownJsonSchema: z.ZodType<unknown> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(unknownJsonSchema),
		z.record(z.string(), unknownJsonSchema),
	]),
);

export const toolOutputSchema = z.looseObject({
	mode: z.enum(BUILDER_MODES).optional(),
	network: z.enum(SUPPORTED_SUI_NETWORKS).optional(),
	config: unknownJsonSchema.optional(),
	game: unknownJsonSchema.optional(),
	action: z.string().optional(),
	plan: unknownJsonSchema.optional(),
	summary: unknownJsonSchema.optional(),
	transactionBytesBase64: z.string().optional(),
	dryRun: unknownJsonSchema.optional(),
	dryRunSummary: unknownJsonSchema.optional(),
	nftCatalog: unknownJsonSchema.optional(),
	ownedNfts: unknownJsonSchema.optional(),
	referral: unknownJsonSchema.optional(),
	wallet: unknownJsonSchema.optional(),
	connection: unknownJsonSchema.optional(),
	execution: unknownJsonSchema.optional(),
	errors: z.array(z.string()).optional(),
});
