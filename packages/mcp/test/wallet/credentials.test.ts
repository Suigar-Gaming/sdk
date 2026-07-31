// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { rm, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testHome = vi.hoisted(
	() => `${process.env.TMPDIR ?? '/tmp'}/suigar-mcp-credentials-${process.pid}`,
);

vi.mock('node:os', () => ({ homedir: () => testHome }));

const credentials = await import('../../src/wallet/credentials.js');
const frontendOrigin = 'http://localhost:5173';
const address =
	'0x0000000000000000000000000000000000000000000000000000000000000001';

beforeEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

afterEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

describe('wallet credentials', () => {
	it('uses safe defaults when no credentials have been saved', async () => {
		await expect(credentials.loadCredentials()).resolves.toEqual({
			version: 1,
			defaultNetwork: 'testnet',
			profiles: {},
		});
	});

	it('persists network-specific profiles with restrictive permissions', async () => {
		await credentials.saveProfile('mainnet', {
			address,
			walletType: 'wallet',
			frontendOrigin,
			connectedAt: '2026-01-01T00:00:00.000Z',
		});
		await credentials.saveProfile('testnet', {
			address: '0x2',
			walletType: 'zklogin',
			frontendOrigin,
			connectedAt: '2026-01-02T00:00:00.000Z',
		});

		const saved = await credentials.loadCredentials();
		expect(saved.defaultNetwork).toBe('testnet');
		expect(saved.profiles.mainnet?.walletType).toBe('wallet');
		expect(saved.profiles.testnet?.walletType).toBe('zklogin');
		expect((await stat(join(testHome, '.suigar-mcp'))).mode & 0o777).toBe(
			0o700,
		);
		expect((await stat(credentials.credentialsPath())).mode & 0o777).toBe(
			0o600,
		);

		await credentials.removeProfile('testnet');
		expect((await credentials.loadCredentials()).profiles).toEqual({
			mainnet: expect.objectContaining({ address }),
		});
	});

	it('normalizes malformed persisted credential metadata', async () => {
		await credentials.saveCredentials({
			version: 1,
			defaultNetwork: 'testnet',
			profiles: {},
		});
		await writeFile(
			credentials.credentialsPath(),
			JSON.stringify({ defaultNetwork: 'devnet', profiles: 'invalid' }),
		);

		await expect(credentials.loadCredentials()).resolves.toEqual({
			version: 1,
			defaultNetwork: 'testnet',
			profiles: {},
		});
	});
});
