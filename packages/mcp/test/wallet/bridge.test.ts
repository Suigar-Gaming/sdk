// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { rm } from 'node:fs/promises';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testHome = vi.hoisted(
	() => `${process.env.TMPDIR ?? '/tmp'}/suigar-mcp-bridge-${process.pid}`,
);
const mocks = vi.hoisted(() => ({
	open: vi.fn<() => Promise<void>>(() => Promise.resolve()),
}));

vi.mock('node:os', () => ({ homedir: () => testHome }));
vi.mock('open', () => ({ default: mocks.open }));

const credentials = await import('../../src/wallet/credentials.js');
const bridge = await import('../../src/wallet/bridge.js');
const loopback = await import('../../src/wallet/loopback.js');

const webOrigin = 'http://localhost:5173';
const address = '0x0000000000000000000000000000000000000000000000000000000000000001';

const bridgeOrigin = (url: string, portParameter: string) => {
	const port = new URL(url).searchParams.get(portParameter);
	if (!port) throw new Error(`Missing ${portParameter} in bridge URL`);
	return loopback.loopbackOrigin(port);
};

const postJson = (url: string, body: unknown) =>
	fetch(url, {
		method: 'POST',
		headers: {
			origin: webOrigin,
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	});

beforeEach(async () => {
	await rm(testHome, { force: true, recursive: true });
	vi.unstubAllEnvs();
	mocks.open.mockClear();
});

afterEach(async () => {
	await rm(testHome, { force: true, recursive: true });
	vi.unstubAllEnvs();
});

describe('wallet loopback bridges', () => {
	it('requires a valid login handshake before accepting a matching callback', async () => {
		const login = await bridge.createLoginBridge({
			network: 'testnet',
			webOrigin,
			open: false,
		});
		const url = new URL(login.url);
		expect(url.pathname).toBe('/connection');
		const origin = bridgeOrigin(login.url, 'port');
		expect(url.searchParams.get('action')).toBe('login');
		expect(url.searchParams.has('network')).toBe(false);
		const state = url.searchParams.get('state');
		expect(state).toMatch(/^[a-f0-9]{64}$/u);

		await expect(
			postJson(`${origin}/callback`, {
				state,
				address,
				walletType: 'wallet',
			}),
		).resolves.toMatchObject({ status: 400 });
		await expect(
			fetch(`${origin}/handshake?state=not-the-pairing-state`, {
				headers: { origin: webOrigin },
			}),
		).resolves.toMatchObject({ status: 403 });
		await expect(
			fetch(`${origin}/handshake?state=${state}`, {
				headers: { origin: webOrigin },
			}),
		).resolves.toMatchObject({ status: 200 });
		await expect(
			postJson(`${origin}/callback`, {
				state,
				address,
				walletType: 'wallet',
			}),
		).resolves.toMatchObject({ status: 200 });
		await expect(login.done).resolves.toMatchObject({
			address,
			walletType: 'wallet',
			frontendOrigin: webOrigin,
		});
	});

	it('returns an approval request only to the paired frontend and records rejection', async () => {
		await credentials.saveProfile('testnet', {
			address,
			walletType: 'wallet',
			frontendOrigin: webOrigin,
			connectedAt: '2026-01-01T00:00:00.000Z',
		});
		const approval = await bridge.createExecutionBridge({
			network: 'testnet',
			webOrigin,
			transactionBytesBase64: 'AA==',
			summary: { game: 'coinflip' },
			open: false,
		});
		const url = new URL(approval.approvalUrl);
		expect(url.pathname).toBe('/approval');
		expect(url.searchParams.has('network')).toBe(false);
		const origin = bridgeOrigin(approval.approvalUrl, 'port');
		const state = url.searchParams.get('state');

		await expect(fetch(`${origin}/request?state=${state}`)).resolves.toMatchObject({
			status: 403,
		});
		const request = await fetch(`${origin}/request?state=${state}`, {
			headers: { origin: webOrigin },
		});
		expect(await request.json()).toMatchObject({
			requestId: approval.requestId,
			address,
			transactionBytesBase64: 'AA==',
		});
		await expect(
			postJson(`${origin}/callback`, { state, address, rejected: true }),
		).resolves.toMatchObject({ status: 200 });
		expect(bridge.getExecutionStatus(approval.requestId)).toEqual({
			requestId: approval.requestId,
			status: 'rejected',
		});
	});

	it('requires browser confirmation before removing the selected wallet profile', async () => {
		await credentials.saveProfile('testnet', {
			address,
			walletType: 'wallet',
			frontendOrigin: webOrigin,
			connectedAt: '2026-01-01T00:00:00.000Z',
		});
		const logout = await bridge.createLogoutBridge({
			network: 'testnet',
			all: false,
			webOrigin,
			open: false,
		});
		const url = new URL(logout.url);
		expect(url.pathname).toBe('/connection');
		expect(url.searchParams.get('action')).toBe('logout');
		expect(url.searchParams.has('network')).toBe(false);
		const origin = bridgeOrigin(logout.url, 'port');
		const state = url.searchParams.get('state');

		await expect(fetch(`${origin}/request?state=${state}`)).resolves.toMatchObject({ status: 403 });
		const request = await fetch(`${origin}/request?state=${state}`, {
			headers: { origin: webOrigin },
		});
		expect(await request.json()).toEqual({ network: 'testnet', all: false });
		expect((await credentials.loadCredentials()).profiles.testnet).toBeDefined();
		await expect(postJson(`${origin}/callback`, { state })).resolves.toMatchObject({ status: 200 });
		await expect(logout.done).resolves.toEqual({
			network: 'testnet',
			all: false,
		});
		expect((await credentials.loadCredentials()).profiles.testnet).toBeUndefined();
	});

	it('opens bridge URLs by default and accepts explicit open opt-out', async () => {
		const login = await bridge.createLoginBridge({
			network: 'testnet',
			webOrigin,
		});
		expect(mocks.open).toHaveBeenCalledWith(login.url);
		login.close();

		mocks.open.mockClear();
		const logout = await bridge.createLogoutBridge({
			network: 'testnet',
			all: false,
			webOrigin,
			open: false,
		});
		expect(mocks.open).not.toHaveBeenCalled();
		logout.close();
	});

	it('uses env and explicit bridge limits for expiration and request body size', async () => {
		vi.stubEnv('SUIGAR_MCP_BRIDGE_TIMEOUT_MS', '1');
		const login = await bridge.createLoginBridge({
			network: 'testnet',
			webOrigin,
			open: false,
		});
		await expect(login.done).rejects.toThrow('Wallet login expired. Start login again.');

		await expect(
			bridge.createLoginBridge({
				network: 'testnet',
				webOrigin,
				maxBodyBytes: 0,
				open: false,
			}),
		).rejects.toThrow('Maximum bridge request body size must be a positive integer.');
	});
});
