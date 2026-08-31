// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { isValidSuiObjectId } from '@mysten/sui/utils';
import { z } from 'zod/v4';
import { CURRENCY_AMOUNT_PATTERN } from '../../utils/index.js';

export const BUILDER_MODES = ['build', 'dry-run', 'read-only', 'execute'] as const;
export const ADDRESS_DESCRIPTION: string =
	'Sui address or SuiNS name such as 0xabc..., name.sui, or sub.name.sui; required for build and dry-run modes.';
export const COIN_TYPE_DESCRIPTION: string =
	'Move coin type such as 0x2::sui::SUI. Defaults to the SDK-configured SUI coin type.';
export const CURRENCY_AMOUNT_DESCRIPTION: string =
	'Currency amount in the chosen coin, converted to base units using the configured coin decimals.';

export const currencyAmountSchema = z.union([
	z.number().nonnegative(),
	z.string().regex(CURRENCY_AMOUNT_PATTERN),
]);

export const suiObjectIdSchema = z
	.string()
	.min(1)
	.refine(isValidSuiObjectId, { message: 'Expected a valid Sui object id.' });

export function requireTransactionFields(
	input: { mode?: string; executionWallet?: string } & Record<string, unknown>,
	context: z.RefinementCtx,
	fields: ReadonlyArray<string>,
): void {
	if (input.mode === 'read-only') {
		return;
	}

	for (const field of fields) {
		if (field === 'owner' && input.mode === 'execute' && input.executionWallet === 'session') {
			continue;
		}

		const value = input[field];
		if (value === undefined || value === null || value === '') {
			context.addIssue({
				code: 'custom',
				path: [field],
				message: `${field} is required unless mode is "read-only".`,
			});
		}
	}
}
