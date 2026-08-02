import { z } from 'zod/v4';
import { configInputSchema } from './config.js';
import { COIN_TYPE_DESCRIPTION } from './shared.js';

const walletOwnerSchema = z
	.string()
	.min(1)
	.optional()
	.describe(
		'Optional Sui address or SuiNS name. Defaults to the connected MCP wallet.',
	);

export const getWalletBalancesInputSchema = configInputSchema
	.extend({ owner: walletOwnerSchema })
	.strict();

export const listWalletCoinsInputSchema = configInputSchema
	.extend({
		owner: walletOwnerSchema,
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
		cursor: z.string().min(1).nullable().optional(),
		limit: z.number().int().min(1).max(100).default(50),
	})
	.strict();

export const getExecutionStatusInputSchema = configInputSchema
	.extend({ requestId: z.string().regex(/^[0-9a-f]{32}$/i) })
	.strict();

export const connectionInputSchema = configInputSchema.strict();

export type GetWalletBalancesInput = z.input<
	typeof getWalletBalancesInputSchema
>;
export type ListWalletCoinsInput = z.input<typeof listWalletCoinsInputSchema>;
export type GetExecutionStatusInput = z.input<
	typeof getExecutionStatusInputSchema
>;
export type ConnectionInput = z.input<typeof connectionInputSchema>;
