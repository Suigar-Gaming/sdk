// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarNetwork } from '@suigar/sdk';

export const BRIDGE_WEB_URL_ENV: string = 'SUIGAR_MCP_BRIDGE_WEB_URL';

export function resolveWebOrigin(network: SuigarNetwork, webUrl?: string): string {
	return (
		webUrl ??
		process.env[BRIDGE_WEB_URL_ENV] ??
		(network === 'mainnet' ? 'https://mcp.suigar.com' : `https://mcp.${network}.suigar.com`)
	);
}
