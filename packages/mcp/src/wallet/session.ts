// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { join } from 'node:path';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Entry } from '@napi-rs/keyring';
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import type { SuigarNetwork } from '@suigar/sdk';
import {
	ensureSuigarMcpDataDirectory,
	suigarMcpDataDirectory,
} from './storage.js';

const SERVICE = 'io.github.suigar-gaming.mcp.session-wallet';
const file = join(suigarMcpDataDirectory, 'session-wallets.json');

export type SessionWallet = {
	address: string;
	createdAt: string;
	source: 'created' | 'imported';
};

type SessionWallets = Partial<Record<SuigarNetwork, SessionWallet>>;

const keychain = (network: SuigarNetwork) => new Entry(SERVICE, network);

const loadWallets = async (): Promise<SessionWallets> => {
	try {
		return JSON.parse(await readFile(file, 'utf8')) as SessionWallets;
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return {};
		throw error;
	}
};

const saveWallets = async (wallets: SessionWallets) => {
	await ensureSuigarMcpDataDirectory();
	await writeFile(file, `${JSON.stringify(wallets, null, 2)}\n`, {
		mode: 0o600,
	});
	await chmod(file, 0o600);
};

export const loadSessionWallet = async (network: SuigarNetwork) =>
	(await loadWallets())[network] ?? null;

export const loadSessionSigner = async (network: SuigarNetwork) => {
	const secret = keychain(network).getPassword();
	if (!secret) {
		throw new Error(
			`No ${network} session wallet is available. Create or recover one first.`,
		);
	}
	return Ed25519Keypair.fromSecretKey(secret);
};

const persistSessionWallet = async (
	network: SuigarNetwork,
	mnemonic: string,
	source: SessionWallet['source'],
) => {
	const signer = Ed25519Keypair.deriveKeypair(mnemonic);
	keychain(network).setPassword(signer.getSecretKey());
	const wallets = await loadWallets();
	const wallet: SessionWallet = {
		address: signer.toSuiAddress(),
		createdAt: new Date().toISOString(),
		source,
	};
	wallets[network] = wallet;
	await saveWallets(wallets);
	return wallet;
};

const page = ({
	network,
	state,
	mnemonic,
}: {
	network: SuigarNetwork;
	state: string;
	mnemonic: string;
}) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Suigar session wallet</title>
<style>body{font:16px system-ui;max-width:720px;margin:48px auto;padding:0 20px;color:#171717}textarea{width:100%;min-height:110px}button{padding:10px 14px}code{display:block;padding:14px;background:#f4f4f5;word-spacing:5px}p.warn{color:#991b1b;font-weight:600}</style></head>
<body><h1>Suigar ${network} session wallet</h1>
<p class="warn">Keep this recovery phrase private. Do not paste it into an AI chat, MCP tool, or website.</p>
<p>Save the phrase offline, then confirm it. You can later import it into a compatible Sui wallet to recover the session-wallet funds.</p>
<code>${mnemonic}</code>
<form method="post" action="/save"><input type="hidden" name="state" value="${state}"><input type="hidden" name="mnemonic" value="${mnemonic}"><p><label><input required type="checkbox" name="confirmed"> I saved this recovery phrase.</label></p><button>Create session wallet</button></form>
<hr><h2>Recover an existing session wallet</h2><form method="post" action="/recover"><input type="hidden" name="state" value="${state}"><textarea required name="mnemonic" placeholder="Enter the recovery phrase locally"></textarea><p><button>Recover session wallet</button></p></form></body></html>`;

const success = (wallet: SessionWallet) =>
	`<!doctype html><html><body><h1>Session wallet ready</h1><p>Address: <code>${wallet.address}</code></p><p>You may close this window and return to your MCP client.</p></body></html>`;

const readForm = (request: IncomingMessage) =>
	new Promise<URLSearchParams>((resolve, reject) => {
		let body = '';
		request.setEncoding('utf8');
		request.on('data', (chunk) => {
			body += chunk;
			if (body.length > 16_384) request.destroy();
		});
		request.on('end', () => resolve(new URLSearchParams(body)));
		request.on('error', reject);
	});

export const createSessionWalletSetup = async (network: SuigarNetwork) => {
	const state = randomBytes(32).toString('hex');
	const mnemonic = generateMnemonic(wordlist, 256);
	const server = createServer(async (request, response) => {
		const url = new URL(request.url ?? '/', 'http://127.0.0.1');
		if (request.method === 'GET' && url.pathname === '/') {
			response.writeHead(200, {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'no-store',
			});
			response.end(page({ network, state, mnemonic }));
			return;
		}
		if (
			request.method !== 'POST' ||
			!['/save', '/recover'].includes(url.pathname)
		) {
			response.writeHead(404).end();
			return;
		}
		try {
			const form = await readForm(request);
			if (form.get('state') !== state) throw new Error('Invalid setup state.');
			const phrase = form.get('mnemonic')?.trim().replace(/\s+/gu, ' ') ?? '';
			if (!validateMnemonic(phrase, wordlist))
				throw new Error('Invalid recovery phrase.');
			if (url.pathname === '/save' && form.get('confirmed') !== 'on')
				throw new Error('Confirm that you saved the recovery phrase.');
			const wallet = await persistSessionWallet(
				network,
				phrase,
				url.pathname === '/save' ? 'created' : 'imported',
			);
			response.writeHead(200, {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'no-store',
			});
			response.end(success(wallet));
			setTimeout(() => server.close(), 500).unref();
		} catch (error) {
			response.writeHead(400, {
				'content-type': 'text/plain; charset=utf-8',
				'cache-control': 'no-store',
			});
			response.end(
				error instanceof Error
					? error.message
					: 'Unable to save session wallet.',
			);
		}
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = (server.address() as AddressInfo).port;
	const timeout = setTimeout(() => server.close(), 10 * 60_000).unref();
	server.once('close', () => clearTimeout(timeout));
	return { setupUrl: `http://127.0.0.1:${port}/` };
};
