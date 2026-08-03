// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

/**
 * Prefer MCP structured content, while accepting hosts that deliver only the
 * textual JSON representation of an otherwise structured tool result.
 */
export const payloadFromToolResult = (result: CallToolResult): unknown => {
	if (result.structuredContent !== undefined) {
		return result.structuredContent;
	}

	for (const item of result.content ?? []) {
		if (item.type !== 'text' || !item.text) {
			continue;
		}
		try {
			return JSON.parse(item.text) as unknown;
		} catch {
			// A text-only tool result is still useful as a raw fallback below.
		}
	}

	return result;
};
