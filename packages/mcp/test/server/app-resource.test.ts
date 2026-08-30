// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	readFile: vi.fn<(path: URL, encoding: 'utf8') => Promise<string>>(),
}));

vi.mock('node:fs/promises', () => ({
	readFile: mocks.readFile,
}));

const {
	createSuigarMcpAppResourceResult,
	NFT_IMAGE_RESOURCE_DOMAINS,
	SUIGAR_MCP_APP_RESOURCE_URI,
} = await import('../../src/server/app-resource.js');

describe('MCP App resource', () => {
	it('serves bundled MCP App HTML with CSP metadata', async () => {
		mocks.readFile.mockResolvedValue('<html><title>Suigar MCP Console</title></html>');

		const result = await createSuigarMcpAppResourceResult();
		const [content] = result.contents;

		expect(content.uri).toBe(SUIGAR_MCP_APP_RESOURCE_URI);
		expect(content.mimeType).toBe('text/html;profile=mcp-app');
		expect(content.text).toContain('Suigar MCP Console');
		expect(content._meta.ui.csp).toEqual({
			connectDomains: [],
			resourceDomains: [...NFT_IMAGE_RESOURCE_DOMAINS],
		});
		expect(content._meta.ui.prefersBorder).toBe(true);
	});
});
