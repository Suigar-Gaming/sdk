// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { rm } from 'node:fs/promises';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
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
		const { setupUrl } = await session.createSessionWalletSetup();
		const page = await (await fetch(setupUrl)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		const mnemonic = page.match(/name="mnemonic" value="([^"]+)"/u)?.[1];

		expect(state).toMatch(/^[0-9a-f]{64}$/u);
		expect(mnemonic?.split(' ')).toHaveLength(24);
		expect(page).toContain('SUIGAR MCP');
		expect(page).toContain('shared by Suigar mainnet and testnet');
		expect(page).not.toContain('<span class="badge">testnet</span>');
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
		expect(savedPage).toContain('both Suigar mainnet and testnet');
		expect(savedPage).toContain('~/.suigar-mcp/session-wallet.json');
		expect(savedPage).toContain('operating-system keychain');
		const wallet = await session.loadSessionWallet();
		expect(wallet).toEqual(
			expect.objectContaining({
				source: 'created',
				address: expect.stringMatching(/^0x/u),
			}),
		);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(
			wallet!.address,
		);
		expect([...keychainEntries.keys()]).toEqual([
			'com.suigar.mcp:session-wallet',
		]);
	});

	it('imports a standard Sui private key through the local setup page', async () => {
		const signer = Ed25519Keypair.generate();
		const { setupUrl } = await session.createSessionWalletSetup();
		const page = await (await fetch(setupUrl)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];

		expect(page).toContain('Import a Sui private key');
		expect(page).toContain('suiprivkey');

		const response = await fetch(`${setupUrl}import-private-key`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				state: state!,
				privateKey: signer.getSecretKey(),
			}),
		});

		expect(response.ok).toBe(true);
		expect(await session.loadSessionWallet()).toEqual(
			expect.objectContaining({
				address: signer.toSuiAddress(),
				source: 'private-key',
			}),
		);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(
			signer.toSuiAddress(),
		);
	});

	it('requires explicit confirmation before replacing an existing session wallet', async () => {
		const firstSigner = Ed25519Keypair.generate();
		const secondSigner = Ed25519Keypair.generate();
		const firstSetup = await session.createSessionWalletSetup();
		const firstPage = await (await fetch(firstSetup.setupUrl)).text();
		const firstState = firstPage.match(
			/name="state" value="([0-9a-f]+)"/u,
		)?.[1];
		await fetch(`${firstSetup.setupUrl}import-private-key`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				state: firstState!,
				privateKey: firstSigner.getSecretKey(),
			}),
		});

		const replacementSetup = await session.createSessionWalletSetup();
		const replacementPage = await (
			await fetch(replacementSetup.setupUrl)
		).text();
		const replacementState = replacementPage.match(
			/name="state" value="([0-9a-f]+)"/u,
		)?.[1];
		expect(replacementPage).toContain(firstSigner.toSuiAddress());
		expect(replacementPage).toContain(
			'replaces the current local session wallet',
		);

		const rejectedResponse = await fetch(
			`${replacementSetup.setupUrl}import-private-key`,
			{
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					state: replacementState!,
					privateKey: secondSigner.getSecretKey(),
				}),
			},
		);
		expect(rejectedResponse.status).toBe(400);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(
			firstSigner.toSuiAddress(),
		);

		const replacementResponse = await fetch(
			`${replacementSetup.setupUrl}import-private-key`,
			{
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					state: replacementState!,
					privateKey: secondSigner.getSecretKey(),
					replace: 'on',
				}),
			},
		);
		expect(replacementResponse.ok).toBe(true);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(
			secondSigner.toSuiAddress(),
		);
	});
});
