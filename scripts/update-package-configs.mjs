/* eslint-disable no-undef */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const NETWORKS = ['mainnet', 'testnet'];

const REGISTRY_PACKAGE_NAMES = {
	core: '@suigar/core',
	coinflip: '@suigar/coinflip',
	limbo: '@suigar/limbo',
	plinko: '@suigar/plinko',
	pvpCoinflip: '@suigar/pvp-coinflip',
	range: '@suigar/range',
	wheel: '@suigar/wheel',
};

function extractObjectValue(source, objectName, key) {
	const blockPattern = new RegExp(
		`${objectName}[\\s\\S]*?=\\s*\\{([\\s\\S]*?)\\n\\};`,
	);
	const blockMatch = source.match(blockPattern);

	if (!blockMatch) {
		throw new Error(`Could not find object ${objectName}`);
	}

	const valuePattern = new RegExp(`${key}:\\s*'([^']*)'`);
	const valueMatch = blockMatch[1].match(valuePattern);

	if (!valueMatch) {
		throw new Error(`Could not find key ${key} in ${objectName}`);
	}

	return valueMatch[1];
}

async function fetchPackageAddress(baseUrl, packageName) {
	const response = await fetch(`${baseUrl}/v1/names/${packageName}`);
	const payload = await response.json();

	if (!response.ok) {
		throw new Error(
			`Failed to resolve ${packageName} from ${baseUrl}: ${payload.message ?? response.statusText}`,
		);
	}

	const packageAddress = payload.package_address ?? payload.package_info?.id;

	if (!packageAddress) {
		throw new Error(
			`Missing package address for ${packageName} from ${baseUrl}`,
		);
	}

	return packageAddress;
}

function getNetworkConfigFilePath(network) {
	return path.join(rootDir, `src/configs/package.${network}.ts`);
}

function getNetworkBaseUrl(network) {
	return `https://${network}.mvr.mystenlabs.com`;
}

function renderNetworkFile(
	network,
	{ packageIds, coinTypes, priceInfoObjectIds },
) {
	const uppercaseNetwork = network.toUpperCase();

	return `// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarCoinTypes } from '../types/suigar-config.type.js';
import type { SuigarPackage, SuigarPriceInfoObjectId } from './package.js';

// \`sweetHouse\` is preserved manually because it is not currently resolved from MVR.
export const ${uppercaseNetwork}_PACKAGE_IDS: SuigarPackage = {
\tsweetHouse:
\t\t'${packageIds.sweetHouse}',
\tcore: '${packageIds.core}',
\tcoinflip:
\t\t'${packageIds.coinflip}',
\tlimbo: '${packageIds.limbo}',
\tplinko: '${packageIds.plinko}',
\tpvpCoinflip:
\t\t'${packageIds.pvpCoinflip}',
\trange: '${packageIds.range}',
\twheel: '${packageIds.wheel}',
};

export const ${uppercaseNetwork}_COIN_TYPES: SuigarCoinTypes = {
\tsui: '${coinTypes.sui}',
\tusdc: '${coinTypes.usdc}',
};

export const ${uppercaseNetwork}_PRICE_INFO_OBJECT_IDS: SuigarPriceInfoObjectId = {
\tsui: '${priceInfoObjectIds.sui}',
\tusdc: '${priceInfoObjectIds.usdc}',
};
`;
}

async function updateNetworkConfig(network) {
	const filePath = getNetworkConfigFilePath(network);
	const baseUrl = getNetworkBaseUrl(network);
	const currentSource = await readFile(filePath, 'utf8');
	const uppercaseNetwork = network.toUpperCase();
	const currentPackageObjectName = `${uppercaseNetwork}_PACKAGE_IDS`;
	const currentCoinTypesObjectName = `${uppercaseNetwork}_COIN_TYPES`;
	const currentPriceObjectName = `${uppercaseNetwork}_PRICE_INFO_OBJECT_IDS`;

	const packageIds = {
		sweetHouse: extractObjectValue(
			currentSource,
			currentPackageObjectName,
			'sweetHouse',
		),
	};

	for (const [packageKey, packageName] of Object.entries(
		REGISTRY_PACKAGE_NAMES,
	)) {
		packageIds[packageKey] = await fetchPackageAddress(baseUrl, packageName);
	}

	const priceInfoObjectIds = {
		sui: extractObjectValue(currentSource, currentPriceObjectName, 'sui'),
		usdc: extractObjectValue(currentSource, currentPriceObjectName, 'usdc'),
	};

	const coinTypes = {
		sui: extractObjectValue(currentSource, currentCoinTypesObjectName, 'sui'),
		usdc: extractObjectValue(currentSource, currentCoinTypesObjectName, 'usdc'),
	};

	const nextSource = renderNetworkFile(network, {
		packageIds,
		coinTypes,
		priceInfoObjectIds,
	});

	await writeFile(filePath, nextSource);
	console.log(`Updated ${network} package config`);
}

for (const network of NETWORKS) {
	await updateNetworkConfig(network);
}
