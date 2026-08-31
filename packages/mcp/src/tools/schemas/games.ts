// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { POSITIVE_INTEGER_PATTERN } from '../../utils/index.js';
import { configInputSchema } from './config.js';
import {
	ADDRESS_DESCRIPTION,
	BUILDER_MODES,
	COIN_TYPE_DESCRIPTION,
	CURRENCY_AMOUNT_DESCRIPTION,
	currencyAmountSchema,
	requireTransactionFields,
	suiObjectIdSchema,
} from './shared.js';

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
		stake: currencyAmountSchema
			.optional()
			.describe(`Logical wager. ${CURRENCY_AMOUNT_DESCRIPTION}`),
		cashStake: currencyAmountSchema
			.optional()
			.describe(`Optional withdrawn amount. ${CURRENCY_AMOUNT_DESCRIPTION}`),
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
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, ['owner', 'stake', 'side']),
	);

export const kenoInputSchema = stakeBuildInputSchema
	.extend({
		configId: z.number().int().min(0).max(255).optional().describe('On-chain Keno config id.'),
		picks: z
			.array(z.number().int().min(0).max(255))
			.optional()
			.describe('Keno board positions selected by the player.'),
	})
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, ['owner', 'stake', 'configId', 'picks']),
	);

export const limboInputSchema = stakeBuildInputSchema
	.extend({
		targetMultiplier: z.number().positive().optional().describe('Target multiplier.'),
	})
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, ['owner', 'stake', 'targetMultiplier']),
	);

export const configIdInputSchema = stakeBuildInputSchema
	.extend({
		configId: z.number().int().min(0).max(255).optional().describe('On-chain game config id.'),
	})
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, ['owner', 'stake', 'configId']),
	);

export const rangeInputSchema = stakeBuildInputSchema
	.extend({
		leftPoint: z.number().optional().describe('Left range point.'),
		rightPoint: z.number().optional().describe('Right range point.'),
		outOfRange: z
			.boolean()
			.optional()
			.describe('Whether the bet targets outside the selected range.'),
	})
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, ['owner', 'stake', 'leftPoint', 'rightPoint']),
	);

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
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, [
			'owner',
			'stake',
			'configId',
			'countryId',
			'shotZoneId',
		]),
	);

export const pvpCoinflipCreateInputSchema = commonBuildInputSchema
	.extend({
		stake: currencyAmountSchema
			.optional()
			.describe(`Stake per player. ${CURRENCY_AMOUNT_DESCRIPTION}`),
		creatorSide: z.enum(['heads', 'tails']).optional().describe('Creator side.'),
		isPrivate: z.boolean().optional().describe('Whether the PvP lobby is private.'),
	})
	.strict()
	.superRefine((input, context) =>
		requireTransactionFields(input, context, ['owner', 'stake', 'creatorSide']),
	);

export const pvpCoinflipJoinInputSchema = commonBuildInputSchema
	.extend({
		gameId: suiObjectIdSchema.optional().describe('PvP Coinflip game object id.'),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
	})
	.strict()
	.superRefine((input, context) => requireTransactionFields(input, context, ['owner', 'gameId']));

export const pvpCoinflipCancelInputSchema = cancelBuildInputSchema
	.extend({
		gameId: suiObjectIdSchema.optional().describe('PvP Coinflip game object id.'),
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
	})
	.strict()
	.superRefine((input, context) => requireTransactionFields(input, context, ['owner', 'gameId']));

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
