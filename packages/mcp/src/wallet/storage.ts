// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { chmod, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const SUIGAR_MCP_DATA_DIRECTORY: string = join(homedir(), '.suigar-mcp');

export async function ensureSuigarMcpDataDirectory(): Promise<string> {
	await mkdir(SUIGAR_MCP_DATA_DIRECTORY, { recursive: true, mode: 0o700 });
	await chmod(SUIGAR_MCP_DATA_DIRECTORY, 0o700);
	return SUIGAR_MCP_DATA_DIRECTORY;
}
