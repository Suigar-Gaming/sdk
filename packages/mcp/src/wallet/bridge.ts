// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { randomBytes, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { hex } from '@scure/base';
import open from 'open';
import type { SuigarNetwork } from '@suigar/sdk';
import {
	clearCredentials,
	loadCredentials,
	removeProfile,
	saveProfile,
	type WalletProfile,
	type WalletType,
} from './credentials.js';
import { LOCALHOST_HOST, LOOPBACK_HOST, loopbackOrigin } from './loopback.js';
import { resolvePositiveInteger } from './utils.js';

export const DEFAULT_TIMEOUT_MS: number = 5 * 60_000;
export const DEFAULT_MAX_BODY_BYTES: number = 16 * 1024;
export const BRIDGE_TIMEOUT_MS_ENV: string = 'SUIGAR_MCP_BRIDGE_TIMEOUT_MS';
export const BRIDGE_MAX_BODY_BYTES_ENV: string = 'SUIGAR_MCP_BRIDGE_MAX_BODY_BYTES';

export type BridgeOptions = {
	timeoutMs?: number;
	maxBodyBytes?: number;
	open?: boolean;
};

export type LoginBridge = {
	url: string;
	done: Promise<WalletProfile>;
	close: () => void;
};
export type LogoutBridge = {
	url: string;
	done: Promise<{ network?: SuigarNetwork; all: boolean }>;
	close: () => void;
};
export type ExecutionStatus = {
	requestId: string;
	status: 'pending' | 'approved' | 'rejected' | 'failed' | 'expired';
	digest?: string;
	error?: string;
};
const EXECUTIONS: Map<string, ExecutionStatus> = new Map();

export function getExecutionStatus(requestId: string): ExecutionStatus | null {
	return EXECUTIONS.get(requestId) ?? null;
}

function sameState(left: string, right: string): boolean {
	if (left.length !== right.length || !/^[0-9a-f]{64}$/i.test(left)) return false;
	return timingSafeEqual(hex.decode(left), hex.decode(right));
}

function resolveBridgeOptions(options: BridgeOptions = {}): Required<BridgeOptions> {
	return {
		timeoutMs: resolvePositiveInteger(
			options.timeoutMs ?? process.env[BRIDGE_TIMEOUT_MS_ENV],
			'Bridge timeout',
			DEFAULT_TIMEOUT_MS,
		),
		maxBodyBytes: resolvePositiveInteger(
			options.maxBodyBytes ?? process.env[BRIDGE_MAX_BODY_BYTES_ENV],
			'Maximum bridge request body size',
			DEFAULT_MAX_BODY_BYTES,
		),
		open: options.open ?? true,
	};
}

async function openBridgeUrl(url: string, shouldOpen: boolean): Promise<void> {
	if (shouldOpen) await open(url).catch(() => undefined);
}

function readBody(request: IncomingMessage, maxBodyBytes: number): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const decoder = new TextDecoder();
		let body = '';
		let length = 0;
		request.on('data', (chunk: Uint8Array) => {
			length += chunk.length;
			if (length > maxBodyBytes) {
				request.destroy();
				reject(new Error('Request body is too large.'));
				return;
			}
			body += decoder.decode(chunk, { stream: true });
		});
		request.on('end', () => resolve(body + decoder.decode()));
		request.on('error', reject);
	});
}

function respond(response: ServerResponse, status: number, body: unknown): void {
	response.writeHead(status, {
		'content-type': 'application/json',
		'cache-control': 'no-store',
	});
	response.end(JSON.stringify(body));
}

async function createLoopbackServer(webOrigin: string): Promise<{
	server: Server;
	port: number;
	close: () => Server;
	authorize: (request: IncomingMessage, response: ServerResponse) => boolean;
}> {
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, LOOPBACK_HOST, resolve));
	const port = (server.address() as AddressInfo).port;
	const allowedHosts = new Set([`${LOOPBACK_HOST}:${port}`, `${LOCALHOST_HOST}:${port}`]);
	const authorize = (request: IncomingMessage, response: ServerResponse) => {
		response.setHeader('access-control-allow-origin', webOrigin);
		response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
		response.setHeader('access-control-allow-headers', 'content-type');
		response.setHeader('vary', 'origin');
		if (
			!allowedHosts.has((request.headers.host ?? '').toLowerCase()) ||
			request.headers.origin !== webOrigin
		) {
			respond(response, 403, { error: 'Forbidden' });
			return false;
		}
		if (request.method === 'OPTIONS') {
			if (request.headers['access-control-request-private-network'] === 'true')
				response.setHeader('access-control-allow-private-network', 'true');
			response.writeHead(204).end();
			return false;
		}
		return true;
	};
	return { server, port, close: () => server.close(), authorize };
}

export async function createLoginBridge({
	network,
	webOrigin,
	...bridgeOptions
}: {
	network: SuigarNetwork;
	webOrigin: string;
} & BridgeOptions): Promise<LoginBridge> {
	const options = resolveBridgeOptions(bridgeOptions);
	const state = randomBytes(32).toString('hex');
	const loopback = await createLoopbackServer(webOrigin);
	const { server, port, close } = loopback;
	let preflight = false;
	const { promise: done, resolve, reject } = Promise.withResolvers<WalletProfile>();
	const timeout = setTimeout(() => {
		close();
		reject(new Error('Wallet login expired. Start login again.'));
	}, options.timeoutMs).unref();

	server.on('request', async (request, response) => {
		if (!loopback.authorize(request, response)) return;
		const url = new URL(request.url ?? '/', loopbackOrigin(port));
		if (request.method === 'GET' && url.pathname === '/handshake') {
			if (!sameState(url.searchParams.get('state') ?? '', state)) {
				respond(response, 403, { ok: false, error: 'Invalid pairing state' });
				return;
			}
			preflight = true;
			respond(response, 200, { ok: true, network });
			return;
		}
		if (request.method !== 'POST' || url.pathname !== '/callback') {
			respond(response, 404, { error: 'Not found' });
			return;
		}
		if (!request.headers['content-type']?.startsWith('application/json')) {
			respond(response, 415, { error: 'Expected JSON' });
			return;
		}
		try {
			const payload = JSON.parse(await readBody(request, options.maxBodyBytes)) as Record<
				string,
				unknown
			>;
			if (typeof payload.state !== 'string' || !sameState(payload.state, state)) {
				respond(response, 403, { error: 'Invalid pairing state' });
				return;
			}
			if (
				!preflight ||
				typeof payload.address !== 'string' ||
				(payload.walletType !== 'wallet' && payload.walletType !== 'zklogin')
			) {
				respond(response, 400, { error: 'Invalid wallet callback' });
				return;
			}
			preflight = false;
			const profile: WalletProfile = {
				address: payload.address,
				walletType: payload.walletType as WalletType,
				frontendOrigin: webOrigin,
				connectedAt: new Date().toISOString(),
			};
			await saveProfile(network, profile);
			clearTimeout(timeout);
			respond(response, 200, { ok: true });
			resolve(profile);
			setTimeout(close, 100).unref();
		} catch {
			respond(response, 400, { error: 'Invalid request' });
		}
	});

	const url = new URL('/connection', webOrigin);
	url.searchParams.set('port', String(port));
	url.searchParams.set('state', state);
	url.searchParams.set('action', 'login');
	const bridgeUrl = url.toString();
	await openBridgeUrl(bridgeUrl, options.open);
	return { url: bridgeUrl, done, close };
}

export async function createExecutionBridge({
	network,
	webOrigin,
	transactionBytesBase64,
	summary,
	...bridgeOptions
}: {
	network: SuigarNetwork;
	webOrigin: string;
	transactionBytesBase64: string;
	summary: unknown;
} & BridgeOptions): Promise<{ requestId: string; approvalUrl: string }> {
	const options = resolveBridgeOptions(bridgeOptions);
	const credentials = await loadCredentials();
	const profile = credentials.profiles[network];
	if (!profile)
		throw new Error(`No wallet is connected for ${network}. Call "suigar_login" first.`);
	const state = randomBytes(32).toString('hex');
	const requestId = randomBytes(16).toString('hex');
	EXECUTIONS.set(requestId, { requestId, status: 'pending' });
	const loopback = await createLoopbackServer(webOrigin);
	const { server, port, close } = loopback;
	const expire = setTimeout(() => {
		EXECUTIONS.set(requestId, { requestId, status: 'expired' });
		close();
	}, options.timeoutMs).unref();
	server.on('request', async (request, response) => {
		const url = new URL(request.url ?? '/', loopbackOrigin(port));
		if (!loopback.authorize(request, response)) return;
		if (!sameState(url.searchParams.get('state') ?? '', state) && request.method === 'GET') {
			respond(response, 403, { error: 'Invalid approval state' });
			return;
		}
		if (request.method === 'GET' && url.pathname === '/request') {
			respond(response, 200, {
				requestId,
				network,
				address: profile.address,
				transactionBytesBase64,
				summary,
			});
			return;
		}
		if (
			request.method !== 'POST' ||
			url.pathname !== '/callback' ||
			!request.headers['content-type']?.startsWith('application/json')
		) {
			respond(response, 404, { error: 'Not found' });
			return;
		}
		try {
			const payload = JSON.parse(await readBody(request, options.maxBodyBytes)) as Record<
				string,
				unknown
			>;
			if (
				typeof payload.state !== 'string' ||
				!sameState(payload.state, state) ||
				payload.address !== profile.address
			) {
				respond(response, 403, { error: 'Invalid approval callback' });
				return;
			}
			const status: ExecutionStatus =
				payload.rejected === true
					? { requestId, status: 'rejected' }
					: typeof payload.digest === 'string'
						? { requestId, status: 'approved', digest: payload.digest }
						: {
								requestId,
								status: 'failed',
								error: typeof payload.error === 'string' ? payload.error : 'Wallet approval failed',
							};
			EXECUTIONS.set(requestId, status);
			clearTimeout(expire);
			respond(response, 200, { ok: true });
			setTimeout(close, 100).unref();
		} catch {
			respond(response, 400, { error: 'Invalid request' });
		}
	});
	const url = new URL('/approval', webOrigin);
	url.searchParams.set('port', String(port));
	url.searchParams.set('state', state);
	const approvalUrl = url.toString();
	await openBridgeUrl(approvalUrl, options.open);
	return { requestId, approvalUrl };
}

export async function createLogoutBridge({
	network,
	all,
	webOrigin,
	...bridgeOptions
}: {
	network?: SuigarNetwork;
	all: boolean;
	webOrigin: string;
} & BridgeOptions): Promise<LogoutBridge> {
	const options = resolveBridgeOptions(bridgeOptions);
	const state = randomBytes(32).toString('hex');
	const loopback = await createLoopbackServer(webOrigin);
	const { server, port, close } = loopback;
	const {
		promise: done,
		resolve,
		reject,
	} = Promise.withResolvers<{
		network?: SuigarNetwork;
		all: boolean;
	}>();
	const timeout = setTimeout(() => {
		close();
		reject(new Error('Wallet logout expired. Start logout again.'));
	}, options.timeoutMs).unref();

	server.on('request', async (request, response) => {
		if (!loopback.authorize(request, response)) return;
		const url = new URL(request.url ?? '/', loopbackOrigin(port));
		if (request.method === 'GET' && url.pathname === '/request') {
			if (!sameState(url.searchParams.get('state') ?? '', state)) {
				respond(response, 403, { error: 'Invalid logout state' });
				return;
			}
			respond(response, 200, { network, all });
			return;
		}
		if (
			request.method !== 'POST' ||
			url.pathname !== '/callback' ||
			!request.headers['content-type']?.startsWith('application/json')
		) {
			respond(response, 404, { error: 'Not found' });
			return;
		}
		try {
			const payload = JSON.parse(await readBody(request, options.maxBodyBytes)) as Record<
				string,
				unknown
			>;
			if (typeof payload.state !== 'string' || !sameState(payload.state, state)) {
				respond(response, 403, { error: 'Invalid logout callback' });
				return;
			}
			if (all) await clearCredentials();
			else if (network) await removeProfile(network);
			clearTimeout(timeout);
			respond(response, 200, { ok: true });
			resolve({ network, all });
			setTimeout(close, 100).unref();
		} catch {
			respond(response, 400, { error: 'Invalid request' });
		}
	});

	const url = new URL('/connection', webOrigin);
	url.searchParams.set('port', String(port));
	url.searchParams.set('state', state);
	url.searchParams.set('action', 'logout');
	if (all) url.searchParams.set('all', 'true');
	const bridgeUrl = url.toString();
	await openBridgeUrl(bridgeUrl, options.open);
	return { url: bridgeUrl, done, close };
}
