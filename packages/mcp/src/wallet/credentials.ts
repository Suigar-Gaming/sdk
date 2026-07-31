// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';
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

export const credentialsPath = () => file;

export async function loadCredentials(): Promise<Credentials> {
	try {
		const parsed: unknown = JSON.parse(await readFile(file, 'utf8'));
		if (!parsed || typeof parsed !== 'object') return empty();
		const candidate = parsed as Partial<Credentials>;
		return {
			version: 1,
			defaultNetwork: isNetwork(candidate.defaultNetwork)
				? candidate.defaultNetwork
				: 'testnet',
			profiles:
				candidate.profiles && typeof candidate.profiles === 'object'
					? candidate.profiles
					: {},
		};
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
