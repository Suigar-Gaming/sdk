// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { rm } from 'node:fs/promises';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const testHome = vi.hoisted(
	() => `${process.env.TMPDIR ?? '/tmp'}/suigar-mcp-bridge-${process.pid}`,
);

vi.mock('node:os', () => ({ homedir: () => testHome }));

const credentials = await import('../../src/wallet/credentials.js');
const bridge = await import('../../src/wallet/bridge.js');

const frontendOrigin = 'http://localhost:5173';
const address =
	'0x0000000000000000000000000000000000000000000000000000000000000001';

const bridgeOrigin = (url: string, portParameter: string) => {
	const port = new URL(url).searchParams.get(portParameter);
	if (!port) throw new Error(`Missing ${portParameter} in bridge URL`);
	return `http://127.0.0.1:${port}`;
};

const postJson = (url: string, body: unknown) =>
	fetch(url, {
		method: 'POST',
		headers: {
			origin: frontendOrigin,
			'content-type': 'application/json',
		},
		body: JSON.stringify(body),
	});

beforeEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

afterEach(async () => {
	await rm(testHome, { force: true, recursive: true });
});

describe('wallet loopback bridges', () => {
	it('requires a valid login handshake before accepting a matching callback', async () => {
		const login = await bridge.createLoginBridge({
			network: 'testnet',
			frontendOrigin,
		});
		const url = new URL(login.url);
		const origin = bridgeOrigin(login.url, 'port');
		const state = url.searchParams.get('connectState');
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
				headers: { origin: frontendOrigin },
			}),
		).resolves.toMatchObject({ status: 403 });
		await expect(
			fetch(`${origin}/handshake?state=${state}`, {
				headers: { origin: frontendOrigin },
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
			frontendOrigin,
		});
	});

	it('returns an approval request only to the paired frontend and records rejection', async () => {
		await credentials.saveProfile('testnet', {
			address,
			walletType: 'wallet',
			frontendOrigin,
			connectedAt: '2026-01-01T00:00:00.000Z',
		});
		const approval = await bridge.createExecutionBridge({
			network: 'testnet',
			frontendOrigin,
			transactionBytesBase64: 'AA==',
			summary: { game: 'coinflip' },
		});
		const url = new URL(approval.approvalUrl);
		const origin = bridgeOrigin(approval.approvalUrl, 'approvalPort');
		const state = url.searchParams.get('approvalState');

		await expect(
			fetch(`${origin}/request?state=${state}`),
		).resolves.toMatchObject({
			status: 403,
		});
		const request = await fetch(`${origin}/request?state=${state}`, {
			headers: { origin: frontendOrigin },
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
			frontendOrigin,
			connectedAt: '2026-01-01T00:00:00.000Z',
		});
		const logout = await bridge.createLogoutBridge({
			network: 'testnet',
			all: false,
			frontendOrigin,
		});
		const url = new URL(logout.url);
		const origin = bridgeOrigin(logout.url, 'logoutPort');
		const state = url.searchParams.get('logoutState');

		await expect(
			fetch(`${origin}/request?state=${state}`),
		).resolves.toMatchObject({ status: 403 });
		const request = await fetch(`${origin}/request?state=${state}`, {
			headers: { origin: frontendOrigin },
		});
		expect(await request.json()).toEqual({ network: 'testnet', all: false });
		expect(
			(await credentials.loadCredentials()).profiles.testnet,
		).toBeDefined();
		await expect(
			postJson(`${origin}/callback`, { state }),
		).resolves.toMatchObject({ status: 200 });
		await expect(logout.done).resolves.toEqual({
			network: 'testnet',
			all: false,
		});
		expect(
			(await credentials.loadCredentials()).profiles.testnet,
		).toBeUndefined();
	});
});
