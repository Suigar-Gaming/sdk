// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveWebOrigin } from '../../src/wallet/origin.js';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('MCP frontend origin', () => {
	it('uses the hosted origin for each supported network by default', () => {
		expect(resolveWebOrigin('mainnet')).toBe('https://mcp.suigar.com');
		expect(resolveWebOrigin('testnet')).toBe('https://mcp.testnet.suigar.com');
	});

	it('uses SUIGAR_MCP_WEB_URL when it is set', () => {
		vi.stubEnv('SUIGAR_MCP_WEB_URL', 'http://localhost:5173');
		expect(resolveWebOrigin('mainnet')).toBe('http://localhost:5173');
		expect(resolveWebOrigin('testnet')).toBe('http://localhost:5173');
	});
});
