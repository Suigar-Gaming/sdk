// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testHome = vi.hoisted(
	() => `${process.env.TMPDIR ?? '/tmp'}/suigar-mcp-session-${process.pid}`,
);
const keychainEntries = vi.hoisted(() => new Map<string, string>());

vi.mock('node:os', () => ({ homedir: () => testHome }));
vi.mock('@napi-rs/keyring', () => ({
	Entry: class Entry {
		constructor(
			private readonly service: string,
			private readonly account: string,
		) {}

		getPassword() {
			return keychainEntries.get(`${this.service}:${this.account}`) ?? null;
		}

		setPassword(password: string) {
			keychainEntries.set(`${this.service}:${this.account}`, password);
		}
	},
}));

const session = await import('../../src/wallet/session.js');

beforeEach(async () => {
	keychainEntries.clear();
	await rm(testHome, { force: true, recursive: true });
});

afterEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

describe('session wallet setup', () => {
	it('stores a newly created wallet in the OS keychain after local confirmation', async () => {
		const { setupUrl } = await session.createSessionWalletSetup('testnet');
		const page = await (await fetch(setupUrl)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		const mnemonic = page.match(/name="mnemonic" value="([^"]+)"/u)?.[1];

		expect(state).toMatch(/^[0-9a-f]{64}$/u);
		expect(mnemonic?.split(' ')).toHaveLength(24);
		expect(page).toContain('SUIGAR MCP');
		expect(page).toContain('color-scheme:light dark');

		const response = await fetch(`${setupUrl}save`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				state: state!,
				mnemonic: mnemonic!,
				confirmed: 'on',
			}),
		});

		expect(response.ok).toBe(true);
		const savedPage = await response.text();
		expect(savedPage).toContain('Session wallet ready');
		expect(savedPage).toContain('~/.suigar-mcp/session-wallets.json');
		expect(savedPage).toContain('operating-system keychain');
		const wallet = await session.loadSessionWallet('testnet');
		expect(wallet).toEqual(
			expect.objectContaining({
				source: 'created',
				address: expect.stringMatching(/^0x/u),
			}),
		);
		expect((await session.loadSessionSigner('testnet')).toSuiAddress()).toBe(
			wallet!.address,
		);
	});
});
