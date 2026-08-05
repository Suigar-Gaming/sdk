// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { randomBytes } from 'node:crypto';
import { chmod, readFile, writeFile } from 'node:fs/promises';
import { createServer, type IncomingMessage } from 'node:http';
import type { AddressInfo } from 'node:net';
import { homedir } from 'node:os';
import { join, relative } from 'node:path';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Entry } from '@napi-rs/keyring';
import { generateMnemonic, validateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import type { SuigarNetwork } from '@suigar/sdk';
import {
	ensureSuigarMcpDataDirectory,
	suigarMcpDataDirectory,
} from './storage.js';

const service = 'suigar.mcp.session-wallet';
const file = join(suigarMcpDataDirectory, 'session-wallets.json');
const displayFile = `~/${relative(homedir(), file)}`;

export type SessionWallet = {
	address: string;
	createdAt: string;
	source: 'created' | 'imported';
};

type SessionWallets = Partial<Record<SuigarNetwork, SessionWallet>>;

const keychain = (network: SuigarNetwork) => new Entry(service, network);

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

const styles = `<style>
:root{color-scheme:light dark;--background:#e4faff;--foreground:#072744;--card:#c8f1fb;--muted:#33546b;--accent:#a5e0f0;--primary:#ffbf49;--primary-foreground:#321c00;--secondary:#1fa8d8;--border:#7eb2c7;--success:#33b98d;--destructive:#de5978}@media(prefers-color-scheme:dark){:root{--background:#030914;--foreground:#edf4ff;--card:#0f1b2f;--muted:#9db3d6;--accent:#173155;--primary:#ffb547;--primary-foreground:#2d1500;--secondary:#4cc5ff;--border:#1f2d47;--success:#45c480;--destructive:#ff5f74}}*{box-sizing:border-box}body{min-height:100dvh;margin:0;background:radial-gradient(circle at top right,color-mix(in srgb,var(--secondary) 24%,transparent),transparent 38%),var(--background);color:var(--foreground);font:16px/1.55 ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:.015em}.shell{width:min(100% - 32px,720px);margin:clamp(24px,8vh,88px) auto}.card{display:grid;gap:20px;padding:clamp(24px,5vw,44px);border:1px solid var(--border);border-radius:24px;background:color-mix(in srgb,var(--card) 92%,transparent);box-shadow:0 28px 70px color-mix(in srgb,var(--background) 75%,transparent)}.eyebrow{margin:0;color:var(--muted);font-size:12px;font-weight:800;letter-spacing:.16em}.heading{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin:0;font-size:clamp(28px,5vw,40px);line-height:1.08}.badge{padding:5px 10px;border:1px solid color-mix(in srgb,var(--secondary) 70%,var(--border));border-radius:999px;background:var(--accent);font:700 13px ui-monospace,SFMono-Regular,Menlo,monospace}.lead{margin:0;color:var(--muted);font-weight:600}.notice{margin:0;padding:14px 16px;border:1px solid color-mix(in srgb,var(--destructive) 70%,var(--border));border-radius:14px;background:color-mix(in srgb,var(--destructive) 12%,transparent);font-weight:700}.recovery{display:block;overflow-wrap:anywhere;padding:18px;border:1px solid var(--border);border-radius:14px;background:color-mix(in srgb,var(--background) 76%,transparent);font:600 15px/1.7 ui-monospace,SFMono-Regular,Menlo,monospace;word-spacing:5px}form{display:grid;gap:14px;margin:0}.confirmation{display:flex;align-items:flex-start;gap:10px;font-weight:650}.confirmation input{margin-top:5px;accent-color:var(--secondary)}.actions{display:flex;flex-wrap:wrap;gap:10px}button{min-height:44px;padding:10px 18px;border:1px solid transparent;border-radius:10px;background:var(--primary);color:var(--primary-foreground);cursor:pointer;font:800 15px/1 ui-sans-serif,system-ui,sans-serif}button.secondary{border-color:var(--border);background:var(--accent);color:var(--foreground)}button:hover{filter:brightness(1.04)}hr{width:100%;height:1px;margin:4px 0;border:0;background:var(--border)}h2{margin:0;font-size:20px}textarea{width:100%;min-height:118px;resize:vertical;padding:12px;border:1px solid var(--border);border-radius:10px;background:color-mix(in srgb,var(--background) 76%,transparent);color:var(--foreground);font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}code.inline{padding:2px 5px;border-radius:5px;background:color-mix(in srgb,var(--background) 76%,transparent);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}.success{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--success);color:#03150a;font-size:23px;font-weight:900}.details{display:grid;gap:8px;padding:16px;border:1px solid var(--border);border-radius:14px;background:color-mix(in srgb,var(--background) 58%,transparent)}.details p{margin:0;color:var(--muted)}@media(max-width:500px){.shell{width:min(100% - 20px,720px)}.card{padding:22px}.actions button{width:100%}}</style>`;

const layout = ({
	title,
	children,
}: {
	title: string;
	children: string;
}) => `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="referrer" content="no-referrer"><title>${title}</title>${styles}</head>
<body><main class="shell"><section class="card">${children}</section></main></body></html>`;

const escapeHtml = (value: string) =>
	value.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');

const page = ({
	network,
	state,
	mnemonic,
}: {
	network: SuigarNetwork;
	state: string;
	mnemonic: string;
}) =>
	layout({
		title: 'Suigar session wallet',
		children: `<p class="eyebrow">SUIGAR MCP</p><h1 class="heading">Session wallet <span class="badge">${network}</span></h1>
<p class="notice">Keep this recovery phrase private. Do not paste it into an AI chat, MCP tool, or website.</p>
<p class="lead">Save the phrase offline, then confirm it. You can later import it into a compatible Sui wallet to recover the session-wallet funds.</p>
<code class="recovery">${mnemonic}</code>
<form method="post" action="/save"><input type="hidden" name="state" value="${state}"><input type="hidden" name="mnemonic" value="${mnemonic}"><label class="confirmation"><input required type="checkbox" name="confirmed"> <span>I saved this recovery phrase somewhere private.</span></label><div class="actions"><button>Create session wallet</button></div></form>
<hr><h2>Recover an existing session wallet</h2><p class="lead">Use a recovery phrase you already saved. It stays on this local page.</p><form method="post" action="/recover"><input type="hidden" name="state" value="${state}"><textarea required name="mnemonic" placeholder="Enter the recovery phrase locally" aria-label="Recovery phrase"></textarea><div class="actions"><button class="secondary">Recover session wallet</button></div></form>`,
	});

const success = (wallet: SessionWallet, network: SuigarNetwork) =>
	layout({
		title: 'Session wallet ready',
		children: `<p class="eyebrow">SUIGAR MCP</p><div class="success" aria-hidden="true">✓</div><h1 class="heading">Session wallet ready <span class="badge">${network}</span></h1>
<p class="lead">Your ${wallet.source === 'created' ? 'new' : 'recovered'} session wallet is ready to use.</p>
<div class="details"><p>Address</p><code class="recovery">${wallet.address}</code><p>Session wallet details saved to <code class="inline">${displayFile}</code>.</p><p>The signing key is stored in your operating-system keychain, not in that file.</p></div>
<p class="lead">You may close this window and return to your MCP client.</p>`,
	});

const failure = (message: string) =>
	layout({
		title: 'Unable to save session wallet',
		children: `<p class="eyebrow">SUIGAR MCP</p><h1 class="heading">Unable to save session wallet</h1><p class="notice">${escapeHtml(message)}</p><p class="lead">Close this tab and start the setup flow again from your MCP client.</p>`,
	});

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
			response.end(success(wallet, network));
			setTimeout(() => server.close(), 500).unref();
		} catch (error) {
			response.writeHead(400, {
				'content-type': 'text/html; charset=utf-8',
				'cache-control': 'no-store',
			});
			response.end(
				failure(
					error instanceof Error
						? error.message
						: 'Unable to save session wallet.',
				),
			);
		}
	});
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = (server.address() as AddressInfo).port;
	const timeout = setTimeout(() => server.close(), 10 * 60_000).unref();
	server.once('close', () => clearTimeout(timeout));
	return { setupUrl: `http://127.0.0.1:${port}/` };
};
