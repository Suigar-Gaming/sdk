// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';
import {
	createSuigarMcpAppResourceResult,
	SUIGAR_MCP_APP_RESOURCE_URI,
} from '../../src/server/app-resource.js';

describe('MCP App resource', () => {
	it('serves MCP App HTML with text fallback and CSP metadata', async () => {
		const result = await createSuigarMcpAppResourceResult();
		const [content] = result.contents;

		expect(content.uri).toBe(SUIGAR_MCP_APP_RESOURCE_URI);
		expect(content.mimeType).toBe('text/html;profile=mcp-app');
		expect(content.text).toContain('Suigar Transaction Inspector');
		expect(content._meta.ui.csp).toEqual({
			connectDomains: [],
			resourceDomains: [],
		});
	});
});
