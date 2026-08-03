// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarNetwork } from '@suigar/sdk';

export const resolveWebOrigin = (network: SuigarNetwork) =>
	process.env.SUIGAR_MCP_WEB_URL ??
	(network === 'mainnet'
		? 'https://mcp.suigar.com'
		: `https://mcp.${network}.suigar.com`);
