// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { chmod, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isValidSuiAddress } from '@mysten/sui/utils';
import type { SuigarNetwork } from '@suigar/sdk';
import { ensureSuigarMcpDataDirectory, SUIGAR_MCP_DATA_DIRECTORY } from './storage.js';

export type WalletType = 'wallet' | 'zklogin';

export type WalletProfile = {
	address: string;
	walletType: WalletType;
	frontendOrigin: string;
	connectedAt: string;
};

export type Credentials = {
	version: 1;
	defaultNetwork: SuigarNetwork;
	profiles: Partial<Record<SuigarNetwork, WalletProfile>>;
};

const CREDENTIALS_FILE: string = join(SUIGAR_MCP_DATA_DIRECTORY, 'credentials.json');
function empty(): Credentials {
	return {
		version: 1,
		defaultNetwork: 'testnet',
		profiles: {},
	};
}

function isNetwork(value: unknown): value is SuigarNetwork {
	return value === 'mainnet' || value === 'testnet';
}

function isWalletProfile(value: unknown): value is WalletProfile {
	if (!value || typeof value !== 'object') return false;
	const profile = value as Record<string, unknown>;
	return (
		typeof profile.address === 'string' &&
		isValidSuiAddress(profile.address) &&
		(profile.walletType === 'wallet' || profile.walletType === 'zklogin') &&
		typeof profile.frontendOrigin === 'string' &&
		typeof profile.connectedAt === 'string'
	);
}

function isValid(value: unknown): value is Credentials {
	if (!value || typeof value !== 'object') return false;
	const credentials = value as Record<string, unknown>;
	if (
		credentials.version !== 1 ||
		!isNetwork(credentials.defaultNetwork) ||
		!credentials.profiles ||
		typeof credentials.profiles !== 'object'
	) {
		return false;
	}

	return Object.entries(credentials.profiles).every(
		([network, profile]) => isNetwork(network) && isWalletProfile(profile),
	);
}

export function credentialsPath(): string {
	return CREDENTIALS_FILE;
}

/**
 * Reads the configured network without requiring callers to load full credentials. This is
 * intentionally synchronous because runtime client creation is synchronous.
 */
export function readPersistedDefaultNetwork(): SuigarNetwork {
	try {
		const value: unknown = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf8'));
		const network =
			value && typeof value === 'object' ? (value as Credentials).defaultNetwork : undefined;
		return isNetwork(network) ? network : 'testnet';
	} catch {
		return 'testnet';
	}
}

export async function loadCredentials(): Promise<Credentials> {
	try {
		const parsed: unknown = JSON.parse(await readFile(CREDENTIALS_FILE, 'utf8'));
		return isValid(parsed) ? parsed : empty();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty();
		throw error;
	}
}

export async function saveCredentials(credentials: Credentials): Promise<void> {
	await ensureSuigarMcpDataDirectory();
	await writeFile(CREDENTIALS_FILE, `${JSON.stringify(credentials, null, 2)}\n`, {
		mode: 0o600,
	});
	await chmod(CREDENTIALS_FILE, 0o600);
}

export async function saveProfile(
	network: SuigarNetwork,
	profile: WalletProfile,
): Promise<Credentials> {
	const credentials = await loadCredentials();
	credentials.defaultNetwork = network;
	credentials.profiles[network] = profile;
	await saveCredentials(credentials);
	return credentials;
}

export async function setDefaultNetwork(network: SuigarNetwork): Promise<Credentials> {
	const credentials = await loadCredentials();
	credentials.defaultNetwork = network;
	await saveCredentials(credentials);
	return credentials;
}

export async function removeProfile(network: SuigarNetwork): Promise<Credentials> {
	const credentials = await loadCredentials();
	delete credentials.profiles[network];
	await saveCredentials(credentials);
	return credentials;
}

export async function clearCredentials(): Promise<void> {
	await rm(CREDENTIALS_FILE, { force: true });
}
