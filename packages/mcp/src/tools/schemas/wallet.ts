// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

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

const sessionWalletIdSchema = z
	.uuid()
	.optional()
	.describe(
		'Optional ID of the named local session wallet. Defaults to the first wallet when used by a session-wallet tool.',
	);

export const getWalletBalancesInputSchema = configInputSchema
	.extend({ owner: walletOwnerSchema, sessionWalletId: sessionWalletIdSchema })
	.strict();

export const listWalletCoinsInputSchema = configInputSchema
	.extend({
		owner: walletOwnerSchema,
		sessionWalletId: sessionWalletIdSchema,
		coinType: z.string().min(1).optional().describe(COIN_TYPE_DESCRIPTION),
		cursor: z.string().min(1).nullable().optional(),
		limit: z.number().int().min(1).max(100).default(50),
	})
	.strict();

export const getExecutionStatusInputSchema = configInputSchema
	.extend({
		requestId: z.string().regex(/^[0-9a-f]{32}$/i),
	})
	.strict();

export const connectionInputSchema = configInputSchema
	.extend({
		webUrl: z
			.url()
			.optional()
			.describe(
				'Browser app origin for wallet pairing and approval pages. Mirrors the login/logout CLI --web-url option.',
			),
		timeoutMs: z
			.number()
			.int()
			.positive()
			.optional()
			.describe(
				'Milliseconds before the local browser bridge expires. Mirrors the login/logout CLI --timeout-ms option.',
			),
		maxBodyBytes: z
			.number()
			.int()
			.positive()
			.optional()
			.describe(
				'Maximum JSON callback body size for the local browser bridge. Mirrors the login/logout CLI --max-body-bytes option.',
			),
		open: z
			.boolean()
			.optional()
			.describe(
				'Whether the login/logout CLI should open the bridge page. Defaults to true.',
			),
		noOpen: z
			.boolean()
			.optional()
			.describe(
				'Set true to pass --no-open to the login/logout CLI and only return the bridge URL.',
			),
	})
	.strict()
	.superRefine((input, context) => {
		if (
			input.open !== undefined &&
			input.noOpen !== undefined &&
			input.open === input.noOpen
		) {
			context.addIssue({
				code: 'custom',
				path: ['noOpen'],
				message: '"open" and "noOpen" are mutually exclusive.',
			});
		}
	});

export const sessionWalletInputSchema = configInputSchema
	.extend({
		sessionWalletId: sessionWalletIdSchema,
	})
	.strict();

export type GetWalletBalancesInput = z.input<
	typeof getWalletBalancesInputSchema
>;
export type ListWalletCoinsInput = z.input<typeof listWalletCoinsInputSchema>;
export type GetExecutionStatusInput = z.input<
	typeof getExecutionStatusInputSchema
>;
export type ConnectionInput = z.input<typeof connectionInputSchema>;
export type SessionWalletInput = z.input<typeof sessionWalletInputSchema>;
