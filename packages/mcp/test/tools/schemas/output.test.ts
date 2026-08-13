// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { toolOutputSchema } from '../../../src/tools/schemas/output.js';

describe('tool output schema', () => {
	it('accepts dry-run summaries and errors in tool output validation', () => {
		expect(() =>
			toolOutputSchema.parse({
				mode: 'dry-run',
				network: 'testnet',
				summary: {},
				dryRun: {},
				dryRunSummary: {
					success: true,
					error: null,
					gasUsed: {},
					balanceChanges: [],
					events: [],
				},
				errors: ['MoveAbort in coinflip::play'],
			}),
		).not.toThrow();
	});
});
