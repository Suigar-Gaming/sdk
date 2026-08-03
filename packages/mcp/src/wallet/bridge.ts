// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { randomBytes, timingSafeEqual } from 'node:crypto';
import {
	createServer,
	type IncomingMessage,
	type ServerResponse,
} from 'node:http';
import type { AddressInfo } from 'node:net';
import type { SuigarNetwork } from '@suigar/sdk';
import {
	clearCredentials,
	loadCredentials,
	removeProfile,
	saveProfile,
	type WalletProfile,
	type WalletType,
} from './credentials.js';

const TIMEOUT_MS = 5 * 60_000;
const MAX_BODY_BYTES = 16 * 1024;

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
const executions = new Map<string, ExecutionStatus>();

export const getExecutionStatus = (requestId: string) =>
	executions.get(requestId) ?? null;

const sameState = (left: string, right: string) => {
	if (left.length !== right.length || !/^[0-9a-f]{64}$/i.test(left))
		return false;
	return timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
};

const readBody = (request: IncomingMessage) =>
	new Promise<string>((resolve, reject) => {
		const chunks: Array<Buffer> = [];
		let length = 0;
		request.on('data', (chunk: Buffer) => {
			length += chunk.length;
			if (length > MAX_BODY_BYTES) {
				request.destroy();
				reject(new Error('Request body is too large.'));
				return;
			}
			chunks.push(chunk);
		});
		request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
		request.on('error', reject);
	});

const respond = (response: ServerResponse, status: number, body: unknown) => {
	response.writeHead(status, {
		'content-type': 'application/json',
		'cache-control': 'no-store',
	});
	response.end(JSON.stringify(body));
};

const createLoopbackServer = async (webOrigin: string) => {
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = (server.address() as AddressInfo).port;
	const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
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
};

export async function createLoginBridge({
	network,
	webOrigin,
}: {
	network: SuigarNetwork;
	webOrigin: string;
}): Promise<LoginBridge> {
	const state = randomBytes(32).toString('hex');
	const loopback = await createLoopbackServer(webOrigin);
	const { server, port, close } = loopback;
	let preflight = false;
	let resolveDone: (profile: WalletProfile) => void;
	let rejectDone: (error: Error) => void;
	const done = new Promise<WalletProfile>((resolve, reject) => {
		resolveDone = resolve;
		rejectDone = reject;
	});
	const timeout = setTimeout(() => {
		close();
		rejectDone(new Error('Wallet login expired. Start login again.'));
	}, TIMEOUT_MS).unref();

	server.on('request', async (request, response) => {
		if (!loopback.authorize(request, response)) return;
		const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
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
			const payload = JSON.parse(await readBody(request)) as Record<
				string,
				unknown
			>;
			if (
				typeof payload.state !== 'string' ||
				!sameState(payload.state, state)
			) {
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
			resolveDone(profile);
			setTimeout(close, 100).unref();
		} catch {
			respond(response, 400, { error: 'Invalid request' });
		}
	});

	const url = new URL('/connection', webOrigin);
	url.searchParams.set('port', String(port));
	url.searchParams.set('state', state);
	url.searchParams.set('action', 'login');
	return { url: url.toString(), done, close };
}

export async function createExecutionBridge({
	network,
	webOrigin,
	transactionBytesBase64,
	summary,
}: {
	network: SuigarNetwork;
	webOrigin: string;
	transactionBytesBase64: string;
	summary: unknown;
}) {
	const credentials = await loadCredentials();
	const profile = credentials.profiles[network];
	if (!profile)
		throw new Error(
			`No wallet is connected for ${network}. Call suigar_login first.`,
		);
	const state = randomBytes(32).toString('hex');
	const requestId = randomBytes(16).toString('hex');
	executions.set(requestId, { requestId, status: 'pending' });
	const loopback = await createLoopbackServer(webOrigin);
	const { server, port, close } = loopback;
	const expire = setTimeout(() => {
		executions.set(requestId, { requestId, status: 'expired' });
		close();
	}, TIMEOUT_MS).unref();
	server.on('request', async (request, response) => {
		const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
		if (!loopback.authorize(request, response)) return;
		if (
			!sameState(url.searchParams.get('state') ?? '', state) &&
			request.method === 'GET'
		) {
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
			const payload = JSON.parse(await readBody(request)) as Record<
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
								error:
									typeof payload.error === 'string'
										? payload.error
										: 'Wallet approval failed',
							};
			executions.set(requestId, status);
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
	return { requestId, approvalUrl: url.toString() };
}

export async function createLogoutBridge({
	network,
	all,
	webOrigin,
}: {
	network?: SuigarNetwork;
	all: boolean;
	webOrigin: string;
}): Promise<LogoutBridge> {
	const state = randomBytes(32).toString('hex');
	const loopback = await createLoopbackServer(webOrigin);
	const { server, port, close } = loopback;
	let resolveDone: (result: { network?: SuigarNetwork; all: boolean }) => void;
	let rejectDone: (error: Error) => void;
	const done = new Promise<{ network?: SuigarNetwork; all: boolean }>(
		(resolve, reject) => {
			resolveDone = resolve;
			rejectDone = reject;
		},
	);
	const timeout = setTimeout(() => {
		close();
		rejectDone(new Error('Wallet logout expired. Start logout again.'));
	}, TIMEOUT_MS).unref();

	server.on('request', async (request, response) => {
		if (!loopback.authorize(request, response)) return;
		const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
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
			const payload = JSON.parse(await readBody(request)) as Record<
				string,
				unknown
			>;
			if (
				typeof payload.state !== 'string' ||
				!sameState(payload.state, state)
			) {
				respond(response, 403, { error: 'Invalid logout callback' });
				return;
			}
			if (all) await clearCredentials();
			else if (network) await removeProfile(network);
			clearTimeout(timeout);
			respond(response, 200, { ok: true });
			resolveDone({ network, all });
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
	return { url: url.toString(), done, close };
}
