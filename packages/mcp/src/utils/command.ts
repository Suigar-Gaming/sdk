// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { spawn } from 'node:child_process';
import { VERSION } from '../version.js';

export function runSuigarCommand(...args: Array<string>): {
	command: string;
	pid: number | undefined;
} {
	const npxArgs = ['-y', `@suigar/mcp@${VERSION}`, ...args];
	const child = spawn('npx', npxArgs, {
		detached: true,
		stdio: 'ignore',
		env: process.env,
	});
	child.on('error', () => undefined);
	child.unref();
	return {
		command: ['npx', ...npxArgs].join(' '),
		pid: child.pid,
	};
}
