// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { GAMES } from '@suigar/sdk/games';
import { configInputSchema } from './config.js';
import { COIN_TYPE_DESCRIPTION } from './shared.js';

export const readGameMetadataInputSchema = configInputSchema
	.extend({
		game: z
			.enum(GAMES)
			.describe('Required single Suigar game id whose live on-chain parameters should be read.'),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
		ignoreCache: z
			.boolean()
			.optional()
			.describe('Refresh on-chain game parameters instead of reading SDK cache.'),
	})
	.strict();

export const listNftsInputSchema = configInputSchema
	.extend({
		owner: z
			.string()
			.min(1)
			.describe('Sui address or SuiNS name whose Suigar NFTs should be listed.'),
	})
	.strict();

export type ReadGameMetadataInput = z.input<typeof readGameMetadataInputSchema>;
export type ListNftsInput = z.input<typeof listNftsInputSchema>;
