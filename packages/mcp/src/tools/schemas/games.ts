// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { CURRENCY_AMOUNT_PATTERN, POSITIVE_INTEGER_PATTERN } from '../../utils/index.js';
import { configInputSchema } from './config.js';
import { ADDRESS_DESCRIPTION, BUILDER_MODES, COIN_TYPE_DESCRIPTION } from './shared.js';

const currencyAmountDescription =
	'Currency amount in the chosen coin, converted to base units using the configured coin decimals.';

const currencyAmountSchema = z.union([
	z.number().nonnegative(),
	z.string().regex(CURRENCY_AMOUNT_PATTERN),
]);

const metadataSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));

const commonBuildInputSchema = configInputSchema
	.extend({
		mode: z
			.enum(BUILDER_MODES)
			.default('build')
			.describe('Build, dry-run, or return a read-only plan.'),
		owner: z.string().min(1).optional().describe(ADDRESS_DESCRIPTION),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
		metadata: metadataSchema.optional().describe('Metadata values encoded by @suigar/sdk.'),
		gasBudget: z.number().int().positive().optional().describe('Optional gas budget in MIST.'),
		useGasCoin: z
			.boolean()
			.optional()
			.describe('Allow the SUI gas coin to be used for native SUI bet coins.'),
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

const cancelBuildInputSchema = commonBuildInputSchema.omit({
	metadata: true,
	useGasCoin: true,
});

const stakeBuildInputSchema = commonBuildInputSchema
	.extend({
		stake: currencyAmountSchema.optional().describe(`Logical wager. ${currencyAmountDescription}`),
		cashStake: currencyAmountSchema
			.optional()
			.describe(`Optional withdrawn amount. ${currencyAmountDescription}`),
		betCount: z
			.union([z.number().int().positive(), z.string().regex(POSITIVE_INTEGER_PATTERN)])
			.optional()
			.describe('Optional bet count.'),
	})
	.strict();

export const coinflipInputSchema = stakeBuildInputSchema
	.extend({
		side: z.enum(['heads', 'tails']).optional().describe('Selected coinflip side.'),
	})
	.strict();

export const kenoInputSchema = stakeBuildInputSchema
	.extend({
		configId: z.number().int().min(0).max(255).optional().describe('On-chain Keno config id.'),
		picks: z
			.array(z.number().int().min(0).max(255))
			.optional()
			.describe('Keno board positions selected by the player.'),
	})
	.strict();

export const limboInputSchema = stakeBuildInputSchema
	.extend({
		targetMultiplier: z.number().positive().optional().describe('Target multiplier.'),
	})
	.strict();

export const configIdInputSchema = stakeBuildInputSchema
	.extend({
		configId: z.number().int().min(0).max(255).optional().describe('On-chain game config id.'),
	})
	.strict();

export const rangeInputSchema = stakeBuildInputSchema
	.extend({
		leftPoint: z.number().optional().describe('Left range point.'),
		rightPoint: z.number().optional().describe('Right range point.'),
		outOfRange: z
			.boolean()
			.optional()
			.describe('Whether the bet targets outside the selected range.'),
	})
	.strict();

export const soccerInputSchema = stakeBuildInputSchema
	.extend({
		configId: z.number().int().min(0).max(255).optional().describe('On-chain Soccer config id.'),
		countryId: z
			.number()
			.int()
			.min(0)
			.max(65_535)
			.optional()
			.describe('On-chain Soccer country id.'),
		shotZoneId: z
			.number()
			.int()
			.min(0)
			.max(255)
			.optional()
			.describe('On-chain Soccer shot zone id.'),
	})
	.strict();

export const pvpCoinflipCreateInputSchema = commonBuildInputSchema
	.extend({
		stake: currencyAmountSchema
			.optional()
			.describe(`Stake per player. ${currencyAmountDescription}`),
		creatorSide: z.enum(['heads', 'tails']).optional().describe('Creator side.'),
		isPrivate: z.boolean().optional().describe('Whether the PvP lobby is private.'),
	})
	.strict();

export const pvpCoinflipJoinInputSchema = commonBuildInputSchema
	.extend({
		gameId: z.string().min(1).optional().describe('PvP Coinflip game object id.'),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
	})
	.strict();

export const pvpCoinflipCancelInputSchema = cancelBuildInputSchema
	.extend({
		gameId: z.string().min(1).optional().describe('PvP Coinflip game object id.'),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
	})
	.strict();

export type CommonBuildInput = z.input<typeof commonBuildInputSchema>;
export type CoinflipInput = z.input<typeof coinflipInputSchema>;
export type KenoInput = z.input<typeof kenoInputSchema>;
export type LimboInput = z.input<typeof limboInputSchema>;
export type ConfigIdInput = z.input<typeof configIdInputSchema>;
export type RangeInput = z.input<typeof rangeInputSchema>;
export type SoccerInput = z.input<typeof soccerInputSchema>;
export type PvpCoinflipCreateInput = z.input<typeof pvpCoinflipCreateInputSchema>;
export type PvpCoinflipJoinInput = z.input<typeof pvpCoinflipJoinInputSchema>;
export type PvpCoinflipCancelInput = z.input<typeof pvpCoinflipCancelInputSchema>;

export type TransactionToolInput =
	| CoinflipInput
	| KenoInput
	| LimboInput
	| ConfigIdInput
	| RangeInput
	| SoccerInput
	| PvpCoinflipCreateInput
	| PvpCoinflipJoinInput
	| PvpCoinflipCancelInput;

export type StandardTransactionToolInput =
	| CoinflipInput
	| KenoInput
	| LimboInput
	| ConfigIdInput
	| RangeInput
	| SoccerInput;
