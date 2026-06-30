// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { z } from 'zod/v4';
import { SUPPORTED_SUI_NETWORKS } from '@suigar/sdk';
import { GAMES } from '@suigar/sdk/games';

export const builderModes = ['build', 'dry-run', 'read-only'] as const;

const addressDescription =
	'Sui address or SuiNS name such as 0xabc..., name.sui, or sub.name.sui; required for build and dry-run modes.';
const coinTypeDescription =
	'Move coin type such as 0x2::sui::SUI. Defaults to the SDK-configured SUI coin type.';
const currencyAmountDescription =
	'Currency amount in the chosen coin, converted to base units using the configured coin decimals.';
const currencyAmountSchema = z.union([
	z.number().nonnegative(),
	z.string().regex(/^(?:\d+|\d+\.\d+|\.\d+)$/u),
]);

const coinMetadataSchema = z
	.object({
		coinType: z.string().min(1).optional(),
		decimals: z.number().int().nonnegative().optional(),
	})
	.strict();

export const configOverridesSchema = z
	.object({
		packageIds: z
			.object({
				sweetHouse: z.string().min(1).optional(),
				core: z.string().min(1).optional(),
				coinflip: z.string().min(1).optional(),
				limbo: z.string().min(1).optional(),
				plinko: z.string().min(1).optional(),
				pvpCoinflip: z.string().min(1).optional(),
				range: z.string().min(1).optional(),
				wheel: z.string().min(1).optional(),
			})
			.strict()
			.optional(),
		registryIds: z
			.object({
				pvpCoinflip: z.string().min(1).optional(),
			})
			.strict()
			.optional(),
		coins: z
			.object({
				sui: coinMetadataSchema.optional(),
				usdc: coinMetadataSchema.optional(),
			})
			.strict()
			.optional(),
		priceInfoObjectIds: z
			.object({
				sui: z.string().min(1).optional(),
				usdc: z.string().min(1).optional(),
			})
			.strict()
			.optional(),
	})
	.strict();

export const configInputSchema = z
	.object({
		network: z
			.enum(SUPPORTED_SUI_NETWORKS)
			.default('testnet')
			.describe('Sui network. Only mainnet and testnet are supported.'),
		providerUrl: z
			.string()
			.url()
			.optional()
			.describe('Optional Sui gRPC endpoint URL.'),
		config: configOverridesSchema
			.optional()
			.describe('SDK-style SuigarConfigOverrides.'),
		partner: z
			.string()
			.min(1)
			.optional()
			.describe('Partner wallet address injected through the SDK extension.'),
	})
	.strict();

export const readConfigInputSchema = configInputSchema;

export const readGameMetadataInputSchema = configInputSchema
	.extend({
		game: z
			.enum(GAMES)
			.optional()
			.describe('Optional Suigar game id to inspect.'),
		coinType: z.string().min(1).optional().describe(coinTypeDescription),
	})
	.strict();

export const metadataSchema = z.record(
	z.string(),
	z.union([z.string(), z.number(), z.boolean()]),
);

export const commonBuildInputSchema = configInputSchema
	.extend({
		mode: z
			.enum(builderModes)
			.default('build')
			.describe('Build, dry-run, or return a read-only plan.'),
		owner: z.string().min(1).optional().describe(addressDescription),
		coinType: z.string().min(1).optional().describe(coinTypeDescription),
		metadata: metadataSchema
			.optional()
			.describe('Metadata values encoded by @suigar/sdk.'),
		gasBudget: z
			.number()
			.int()
			.positive()
			.optional()
			.describe('Optional gas budget in MIST.'),
		useGasCoin: z
			.boolean()
			.optional()
			.describe('Allow the SUI gas coin to be used for native SUI bet coins.'),
	})
	.strict();

export const stakeBuildInputSchema = commonBuildInputSchema
	.extend({
		stake: currencyAmountSchema
			.optional()
			.describe(`Logical wager. ${currencyAmountDescription}`),
		cashStake: currencyAmountSchema
			.optional()
			.describe(`Optional withdrawn amount. ${currencyAmountDescription}`),
		betCount: z
			.union([z.number().int().positive(), z.string().regex(/^[1-9]\d*$/u)])
			.optional()
			.describe('Optional bet count.'),
	})
	.strict();

export const coinflipInputSchema = stakeBuildInputSchema
	.extend({
		side: z
			.enum(['heads', 'tails'])
			.optional()
			.describe('Selected coinflip side.'),
	})
	.strict();

export const limboInputSchema = stakeBuildInputSchema
	.extend({
		targetMultiplier: z
			.number()
			.positive()
			.optional()
			.describe('Target multiplier.'),
	})
	.strict();

export const configIdInputSchema = stakeBuildInputSchema
	.extend({
		configId: z
			.number()
			.int()
			.min(0)
			.max(255)
			.optional()
			.describe('On-chain game config id.'),
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

export const pvpCoinflipCreateInputSchema = commonBuildInputSchema
	.extend({
		stake: currencyAmountSchema
			.optional()
			.describe(`Stake per player. ${currencyAmountDescription}`),
		creatorSide: z
			.enum(['heads', 'tails'])
			.optional()
			.describe('Creator side.'),
		isPrivate: z
			.boolean()
			.optional()
			.describe('Whether the PvP lobby is private.'),
	})
	.strict();

export const pvpCoinflipJoinInputSchema = commonBuildInputSchema
	.extend({
		gameId: z
			.string()
			.min(1)
			.optional()
			.describe('PvP coinflip game object id.'),
		coinType: z.string().min(1).optional().describe(coinTypeDescription),
	})
	.strict();

export const pvpCoinflipCancelInputSchema = commonBuildInputSchema
	.extend({
		gameId: z
			.string()
			.min(1)
			.optional()
			.describe('PvP coinflip game object id.'),
		coinType: z.string().min(1).optional().describe(coinTypeDescription),
	})
	.strict();

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

export const toolOutputSchema = z
	.object({
		mode: z.enum(builderModes).optional(),
		network: z.enum(SUPPORTED_SUI_NETWORKS).optional(),
		config: unknownJsonSchema.optional(),
		game: unknownJsonSchema.optional(),
		action: z.string().optional(),
		plan: unknownJsonSchema.optional(),
		summary: unknownJsonSchema.optional(),
		transactionBytesBase64: z.string().optional(),
		dryRun: unknownJsonSchema.optional(),
		dryRunSummary: unknownJsonSchema.optional(),
		errors: z.array(z.string()).optional(),
	})
	.loose();

export type ReadConfigInput = z.input<typeof readConfigInputSchema>;
export type ReadGameMetadataInput = z.input<typeof readGameMetadataInputSchema>;
export type CommonBuildInput = z.input<typeof commonBuildInputSchema>;
export type CoinflipInput = z.input<typeof coinflipInputSchema>;
export type LimboInput = z.input<typeof limboInputSchema>;
export type ConfigIdInput = z.input<typeof configIdInputSchema>;
export type RangeInput = z.input<typeof rangeInputSchema>;
export type PvpCoinflipCreateInput = z.input<
	typeof pvpCoinflipCreateInputSchema
>;
export type PvpCoinflipJoinInput = z.input<typeof pvpCoinflipJoinInputSchema>;
export type PvpCoinflipCancelInput = z.input<
	typeof pvpCoinflipCancelInputSchema
>;
