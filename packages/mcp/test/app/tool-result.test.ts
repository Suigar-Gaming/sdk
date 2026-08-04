// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import { payloadFromToolResult } from '../../src/app/src/lib/tool-result.js';

describe('payloadFromToolResult', () => {
	it('prefers structured content when the host provides it', () => {
		expect(
			payloadFromToolResult({
				content: [{ type: 'text', text: '{"mode":"read"}' }],
				structuredContent: { mode: 'execute' },
			}),
		).toEqual({ mode: 'execute' });
	});

	it('decodes JSON text when structured content is omitted by the host', () => {
		expect(
			payloadFromToolResult({
				content: [
					{
						type: 'text',
						text: '{"mode":"execute","execution":{"status":"pending"}}',
					},
				],
			}),
		).toEqual({
			mode: 'execute',
			execution: { status: 'pending' },
		});
	});
});
