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
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
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
				name: 'Daily bets',
				confirmed: 'on',
			}),
		});

		expect(response.ok).toBe(true);
		const savedPage = await response.text();
		expect(savedPage).toContain('Session wallet ready');
		expect(savedPage).toContain('both Suigar mainnet and testnet');
		expect(savedPage).toContain('~/.suigar-mcp/session-wallets.json');
		expect(savedPage).toContain('operating-system keychain');
		const wallet = await session.loadSessionWallet();
		expect(wallet).toEqual(
			expect.objectContaining({
				source: 'created',
				name: 'Daily bets',
				id: expect.stringMatching(/^[0-9a-f-]{36}$/u),
				address: expect.stringMatching(/^0x/u),
			}),
		);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(
			wallet!.address,
		);
		expect([...keychainEntries.keys()]).toEqual([
			`com.suigar.mcp:session-wallet:${wallet!.id}`,
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
				name: 'Imported wallet',
			}),
		});

		expect(response.ok).toBe(true);
		expect(await session.loadSessionWallet()).toEqual(
			expect.objectContaining({
				address: signer.toSuiAddress(),
				source: 'private-key',
				name: 'Imported wallet',
			}),
		);
		expect((await session.loadSessionSigner()).toSuiAddress()).toBe(
			signer.toSuiAddress(),
		);
	});

	it('keeps multiple named wallets and selects each signer by ID', async () => {
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
				name: 'First wallet',
			}),
		});

		const secondSetup = await session.createSessionWalletSetup();
		const secondPage = await (await fetch(secondSetup.setupUrl)).text();
		const secondState = secondPage.match(
			/name="state" value="([0-9a-f]+)"/u,
		)?.[1];
		expect(secondPage).toContain(firstSigner.toSuiAddress());
		expect(secondPage).toContain('adds it to your local wallet list');

		const secondResponse = await fetch(
			`${secondSetup.setupUrl}import-private-key`,
			{
				method: 'POST',
				headers: { 'content-type': 'application/x-www-form-urlencoded' },
				body: new URLSearchParams({
					state: secondState!,
					privateKey: secondSigner.getSecretKey(),
					name: 'Second wallet',
				}),
			},
		);
		expect(secondResponse.ok).toBe(true);
		const wallets = await session.listSessionWallets();
		expect(wallets).toEqual([
			expect.objectContaining({
				name: 'First wallet',
				address: firstSigner.toSuiAddress(),
			}),
			expect.objectContaining({
				name: 'Second wallet',
				address: secondSigner.toSuiAddress(),
			}),
		]);
		expect(
			(await session.loadSessionSigner(wallets[0]!.id)).toSuiAddress(),
		).toBe(firstSigner.toSuiAddress());
		expect(
			(await session.loadSessionSigner(wallets[1]!.id)).toSuiAddress(),
		).toBe(secondSigner.toSuiAddress());
	});

	it('uses the setup timeout environment value', async () => {
		vi.stubEnv(session.SESSION_SETUP_TIMEOUT_MS_ENV, '1234');
		const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
		const { setupUrl } = await session.createSessionWalletSetup();
		const page = await (await fetch(setupUrl)).text();
		const state = page.match(/name="state" value="([0-9a-f]+)"/u)?.[1];
		const privateKey = Ed25519Keypair.generate().getSecretKey();

		expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1234);

		await fetch(`${setupUrl}import-private-key`, {
			method: 'POST',
			headers: { 'content-type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				state: state!,
				privateKey,
				name: 'Timeout test',
			}),
		});
	});

	it('rejects an invalid setup timeout environment value', async () => {
		vi.stubEnv(session.SESSION_SETUP_TIMEOUT_MS_ENV, '0');

		await expect(session.createSessionWalletSetup()).rejects.toThrow(
			'Session wallet setup timeout must be a positive integer.',
		);
	});
});
