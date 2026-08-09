// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarNetwork } from '@suigar/sdk';

export const BRIDGE_WEB_URL_ENV = 'SUIGAR_MCP_BRIDGE_WEB_URL';

export const resolveWebOrigin = (network: SuigarNetwork, webUrl?: string) =>
	webUrl ??
	process.env[BRIDGE_WEB_URL_ENV] ??
	(network === 'mainnet'
		? 'https://mcp.suigar.com'
		: `https://mcp.${network}.suigar.com`);
