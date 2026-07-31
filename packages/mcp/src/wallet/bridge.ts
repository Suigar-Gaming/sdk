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
	loadCredentials,
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

export async function createLoginBridge({
	network,
	frontendOrigin,
}: {
	network: SuigarNetwork;
	frontendOrigin: string;
}): Promise<LoginBridge> {
	const state = randomBytes(32).toString('hex');
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = (server.address() as AddressInfo).port;
	const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
	let preflight = false;
	let resolveDone: (profile: WalletProfile) => void;
	let rejectDone: (error: Error) => void;
	const done = new Promise<WalletProfile>((resolve, reject) => {
		resolveDone = resolve;
		rejectDone = reject;
	});
	const close = () => server.close();
	const timeout = setTimeout(() => {
		close();
		rejectDone(new Error('Wallet login expired. Start login again.'));
	}, TIMEOUT_MS).unref();

	server.on('request', async (request, response) => {
		const origin = request.headers.origin;
		response.setHeader('access-control-allow-origin', frontendOrigin);
		response.setHeader('access-control-allow-methods', 'POST, OPTIONS');
		response.setHeader('access-control-allow-headers', 'content-type');
		response.setHeader('vary', 'origin');
		if (request.method === 'OPTIONS') {
			if (request.headers['access-control-request-private-network'] === 'true')
				response.setHeader('access-control-allow-private-network', 'true');
			response.writeHead(204).end();
			return;
		}
		if (
			!allowedHosts.has((request.headers.host ?? '').toLowerCase()) ||
			origin !== frontendOrigin
		) {
			respond(response, 403, { error: 'Forbidden' });
			return;
		}
		if (
			request.method !== 'POST' ||
			!['/preflight', '/callback'].includes(
				new URL(request.url ?? '/', `http://127.0.0.1:${port}`).pathname,
			)
		) {
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
			if (!sameState(String(payload.state ?? ''), state)) {
				respond(response, 403, { error: 'Invalid pairing state' });
				return;
			}
			if (request.url?.startsWith('/preflight')) {
				preflight = true;
				respond(response, 200, { ok: true, network });
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
				frontendOrigin,
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

	const url = new URL('/mcp', frontendOrigin);
	url.searchParams.set('port', String(port));
	url.searchParams.set('connectState', state);
	url.searchParams.set('network', network);
	return { url: url.toString(), done, close };
}

export async function createExecutionBridge({
	network,
	frontendOrigin,
	transactionBytesBase64,
	summary,
}: {
	network: SuigarNetwork;
	frontendOrigin: string;
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
	const server = createServer();
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
	const port = (server.address() as AddressInfo).port;
	const allowedHosts = new Set([`127.0.0.1:${port}`, `localhost:${port}`]);
	const close = () => server.close();
	const expire = setTimeout(() => {
		executions.set(requestId, { requestId, status: 'expired' });
		close();
	}, TIMEOUT_MS).unref();
	server.on('request', async (request, response) => {
		const url = new URL(request.url ?? '/', `http://127.0.0.1:${port}`);
		response.setHeader('access-control-allow-origin', frontendOrigin);
		response.setHeader('access-control-allow-methods', 'GET, POST, OPTIONS');
		response.setHeader('access-control-allow-headers', 'content-type');
		response.setHeader('vary', 'origin');
		if (request.method === 'OPTIONS') {
			if (request.headers['access-control-request-private-network'] === 'true')
				response.setHeader('access-control-allow-private-network', 'true');
			response.writeHead(204).end();
			return;
		}
		if (
			!allowedHosts.has((request.headers.host ?? '').toLowerCase()) ||
			request.headers.origin !== frontendOrigin
		) {
			respond(response, 403, { error: 'Forbidden' });
			return;
		}
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
				!sameState(String(payload.state ?? ''), state) ||
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
	const url = new URL('/mcp', frontendOrigin);
	url.searchParams.set('approvalPort', String(port));
	url.searchParams.set('approvalState', state);
	url.searchParams.set('network', network);
	return { requestId, approvalUrl: url.toString() };
}
