import { z } from 'zod/v4';
import { SUPPORTED_SUI_NETWORKS } from '@suigar/sdk';

const coinMetadataSchema = z
	.object({
		coinType: z.string().min(1).optional(),
		decimals: z.number().int().nonnegative().optional(),
		priceInfoObjectId: z.string().min(1).optional(),
	})
	.strict();

const configOverridesSchema = z
	.object({
		packageIds: z
			.object({
				nftV1: z.string().min(1).optional(),
				referral: z.string().min(1).optional(),
				core: z.string().min(1).optional(),
				coinflip: z.string().min(1).optional(),
				limbo: z.string().min(1).optional(),
				plinko: z.string().min(1).optional(),
				pvpCoinflip: z.string().min(1).optional(),
				range: z.string().min(1).optional(),
				soccer: z.string().min(1).optional(),
				wheel: z.string().min(1).optional(),
			})
			.strict()
			.optional(),
		objectIds: z
			.object({
				sweetHouse: z.string().min(1).optional(),
				nftV1Factory: z.string().min(1).optional(),
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
	})
	.strict();

export const configInputSchema = z
	.object({
		network: z
			.enum(SUPPORTED_SUI_NETWORKS)
			.default('testnet')
			.describe('Sui network. Only mainnet and testnet are supported.'),
		providerUrl: z.url().optional().describe('Optional Sui gRPC endpoint URL.'),
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

export type ReadConfigInput = z.input<typeof readConfigInputSchema>;
