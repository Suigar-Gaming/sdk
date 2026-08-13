// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

import packageJson from '../../package.json' with { type: 'json' };

const mocks = vi.hoisted(() => ({
	spawn:
		vi.fn<
			(
				command: string,
				args: Array<string>,
				options: Record<string, unknown>,
			) => { pid: number; on: () => void; unref: () => void }
		>(),
	on: vi.fn<() => void>(),
	unref: vi.fn<() => void>(),
}));

vi.mock('node:child_process', () => ({
	spawn: mocks.spawn,
}));

const { runSuigarCommand } = await import('../../src/utils/index.js');

describe('runSuigarCommand', () => {
	it('starts the current MCP package version with npx', () => {
		mocks.spawn.mockReturnValue({
			pid: 1234,
			on: mocks.on,
			unref: mocks.unref,
		});

		const result = runSuigarCommand('login', '--network', 'testnet');
		const packageSpec = `@suigar/mcp@${packageJson.version}`;

		expect(mocks.spawn).toHaveBeenCalledWith(
			'npx',
			['-y', packageSpec, 'login', '--network', 'testnet'],
			expect.objectContaining({
				detached: true,
				stdio: 'ignore',
				env: process.env,
			}),
		);
		expect(mocks.on).toHaveBeenCalledWith('error', expect.any(Function));
		expect(mocks.unref).toHaveBeenCalled();
		expect(result).toEqual({
			command: `npx -y ${packageSpec} login --network testnet`,
			pid: 1234,
		});
	});
});
