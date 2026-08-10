// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { chmod, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

export const suigarMcpDataDirectory = join(homedir(), '.suigar-mcp');

export async function ensureSuigarMcpDataDirectory(): Promise<string> {
	await mkdir(suigarMcpDataDirectory, { recursive: true, mode: 0o700 });
	await chmod(suigarMcpDataDirectory, 0o700);
	return suigarMcpDataDirectory;
}
