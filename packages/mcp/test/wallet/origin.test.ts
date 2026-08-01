// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveFrontendOrigin } from '../../src/wallet/origin.js';

afterEach(() => {
	vi.unstubAllEnvs();
});

describe('MCP frontend origin', () => {
	it('uses the hosted origin for each supported network by default', () => {
		expect(resolveFrontendOrigin('mainnet')).toBe('https://suigar.com');
		expect(resolveFrontendOrigin('testnet')).toBe('https://testnet.suigar.com');
	});

	it('uses SUIGAR_MCP_WEB_URL when it is set', () => {
		vi.stubEnv('SUIGAR_MCP_WEB_URL', 'http://localhost:5173');
		expect(resolveFrontendOrigin('mainnet')).toBe('http://localhost:5173');
		expect(resolveFrontendOrigin('testnet')).toBe('http://localhost:5173');
	});
});
