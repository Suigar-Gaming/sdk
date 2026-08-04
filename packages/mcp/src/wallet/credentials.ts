// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { isValidSuiAddress } from '@mysten/sui/utils';
import type { SuigarNetwork } from '@suigar/sdk';

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

const directory = join(homedir(), '.suigar-mcp');
const file = join(directory, 'credentials.json');
const empty = (): Credentials => ({
	version: 1,
	defaultNetwork: 'testnet',
	profiles: {},
});

const isNetwork = (value: unknown): value is SuigarNetwork =>
	value === 'mainnet' || value === 'testnet';

const isWalletProfile = (value: unknown): value is WalletProfile => {
	if (!value || typeof value !== 'object') return false;
	const profile = value as Record<string, unknown>;
	return (
		typeof profile.address === 'string' &&
		isValidSuiAddress(profile.address) &&
		(profile.walletType === 'wallet' || profile.walletType === 'zklogin') &&
		typeof profile.frontendOrigin === 'string' &&
		typeof profile.connectedAt === 'string'
	);
};

const isValid = (value: unknown): value is Credentials => {
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
};

export const credentialsPath = () => file;

/**
 * Reads the configured network without requiring callers to load full credentials.
 * This is intentionally synchronous because runtime client creation is synchronous.
 */
export const readPersistedDefaultNetwork = (): SuigarNetwork => {
	try {
		const value: unknown = JSON.parse(readFileSync(file, 'utf8'));
		const network =
			value && typeof value === 'object'
				? (value as { defaultNetwork?: unknown }).defaultNetwork
				: undefined;
		return isNetwork(network) ? network : 'testnet';
	} catch {
		return 'testnet';
	}
};

export async function loadCredentials(): Promise<Credentials> {
	try {
		const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
		return isValid(parsed) ? parsed : empty();
	} catch (error) {
		if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty();
		throw error;
	}
}

export async function saveCredentials(credentials: Credentials) {
	await mkdir(directory, { recursive: true, mode: 0o700 });
	await chmod(directory, 0o700);
	await writeFile(file, `${JSON.stringify(credentials, null, 2)}\n`, {
		mode: 0o600,
	});
	await chmod(file, 0o600);
}

export async function saveProfile(
	network: SuigarNetwork,
	profile: WalletProfile,
) {
	const credentials = await loadCredentials();
	credentials.defaultNetwork = network;
	credentials.profiles[network] = profile;
	await saveCredentials(credentials);
	return credentials;
}

export async function setDefaultNetwork(network: SuigarNetwork) {
	const credentials = await loadCredentials();
	credentials.defaultNetwork = network;
	await saveCredentials(credentials);
	return credentials;
}

export async function removeProfile(network: SuigarNetwork) {
	const credentials = await loadCredentials();
	delete credentials.profiles[network];
	await saveCredentials(credentials);
	return credentials;
}

export async function clearCredentials() {
	await rm(file, { force: true });
}
