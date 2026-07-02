// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const NETWORKS = ['testnet', 'mainnet'] as const;
type Network = (typeof NETWORKS)[number];

const REGISTRY_PACKAGE_NAMES = {
	core: '@suigar/core',
	coinflip: '@suigar/coinflip',
	limbo: '@suigar/limbo',
	plinko: '@suigar/plinko',
	pvpCoinflip: '@suigar/pvp-coinflip',
	range: '@suigar/range',
	wheel: '@suigar/wheel',
} as const;

type PackageIds = Record<
	keyof typeof REGISTRY_PACKAGE_NAMES | 'sweetHouse',
	string
>;
type CoinMetadataSource = {
	coinType: string;
	decimals: string;
};
type CoinKey = 'sui' | 'usdc';
type CoinMetadataSources = Record<CoinKey, CoinMetadataSource>;
type PriceInfoObjectIds = Record<CoinKey, string>;

function extractObjectValue(source: string, objectName: string, key: string) {
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

function extractCoinMetadata(
	source: string,
	objectName: string,
	key: string,
): CoinMetadataSource {
	const blockPattern = new RegExp(
		`${objectName}[\\s\\S]*?=\\s*\\{([\\s\\S]*?)\\n\\};`,
	);
	const blockMatch = source.match(blockPattern);

	if (!blockMatch) {
		throw new Error(`Could not find object ${objectName}`);
	}

	const entryPattern = new RegExp(
		`${key}:\\s*\\{[\\s\\S]*?coinType:\\s*([^,\\n]+),[\\s\\S]*?decimals:\\s*([^,\\n]+),[\\s\\S]*?\\}`,
	);
	const entryMatch = blockMatch[1].match(entryPattern);

	if (!entryMatch) {
		throw new Error(`Could not find coin metadata for ${key} in ${objectName}`);
	}

	return {
		coinType: entryMatch[1].trim(),
		decimals: entryMatch[2].trim(),
	};
}

async function fetchPackageAddress(baseUrl: string, packageName: string) {
	const response = await fetch(`${baseUrl}/v1/names/${packageName}`);
	const payload = (await response.json()) as {
		message?: string;
		package_address?: string;
		package_info?: { id?: string };
	};

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

function getNetworkConfigFilePath(network: Network) {
	return path.join(rootDir, `src/configs/package.${network}.ts`);
}

function getNetworkBaseUrl(network: Network) {
	return `https://${network}.mvr.mystenlabs.com`;
}

function renderNetworkFile(
	network: Network,
	{
		packageIds,
		coins,
		priceInfoObjectIds,
	}: {
		packageIds: PackageIds;
		coins: CoinMetadataSources;
		priceInfoObjectIds: PriceInfoObjectIds;
	},
) {
	const uppercaseNetwork = network.toUpperCase();
	const isMainnet = network === 'mainnet';
	const imports = isMainnet
		? "import { SUI_DECIMALS, SUI_TYPE_ARG } from '@mysten/sui/utils';\nimport type {\n\tSuigarCoinRegistry,\n\tSuigarPackageIds,\n\tSuigarPriceInfoObjectIds,\n} from '../types/suigar-config.type.js';"
		: "import type {\n\tSuigarCoinRegistry,\n\tSuigarPackageIds,\n\tSuigarPriceInfoObjectIds,\n} from '../types/suigar-config.type.js';";

	return `// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

${imports}

// \`sweetHouse\` is preserved manually because it is not currently resolved from MVR.
export const ${uppercaseNetwork}_PACKAGE_IDS: SuigarPackageIds = {
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

export const ${uppercaseNetwork}_COINS: SuigarCoinRegistry = {
\tsui: {
\t\tcoinType: ${isMainnet ? 'SUI_TYPE_ARG' : coins.sui.coinType},
\t\tdecimals: ${isMainnet ? 'SUI_DECIMALS' : coins.sui.decimals},
\t},
\tusdc: {
\t\tcoinType: ${coins.usdc.coinType},
\t\tdecimals: ${coins.usdc.decimals},
\t},
};

export const ${uppercaseNetwork}_PRICE_INFO_OBJECT_IDS: SuigarPriceInfoObjectIds = {
\tsui: '${priceInfoObjectIds.sui}',
\tusdc: '${priceInfoObjectIds.usdc}',
};
`;
}

async function updateNetworkConfig(network: Network) {
	const filePath = getNetworkConfigFilePath(network);
	const baseUrl = getNetworkBaseUrl(network);
	const currentSource = await readFile(filePath, 'utf8');
	const uppercaseNetwork = network.toUpperCase();
	const currentPackageObjectName = `${uppercaseNetwork}_PACKAGE_IDS`;
	const currentCoinsObjectName = `${uppercaseNetwork}_COINS`;
	const currentPriceObjectName = `${uppercaseNetwork}_PRICE_INFO_OBJECT_IDS`;

	const packageIds: PackageIds = {
		sweetHouse: extractObjectValue(
			currentSource,
			currentPackageObjectName,
			'sweetHouse',
		),
		core: '',
		coinflip: '',
		limbo: '',
		plinko: '',
		pvpCoinflip: '',
		range: '',
		wheel: '',
	};

	for (const [packageKey, packageName] of Object.entries(
		REGISTRY_PACKAGE_NAMES,
	) as Array<[keyof typeof REGISTRY_PACKAGE_NAMES, string]>) {
		packageIds[packageKey] = await fetchPackageAddress(baseUrl, packageName);
	}

	const priceInfoObjectIds: PriceInfoObjectIds = {
		sui: extractObjectValue(currentSource, currentPriceObjectName, 'sui'),
		usdc: extractObjectValue(currentSource, currentPriceObjectName, 'usdc'),
	};

	const coins: CoinMetadataSources = {
		sui: extractCoinMetadata(currentSource, currentCoinsObjectName, 'sui'),
		usdc: extractCoinMetadata(currentSource, currentCoinsObjectName, 'usdc'),
	};

	const nextSource = renderNetworkFile(network, {
		packageIds,
		coins,
		priceInfoObjectIds,
	});

	await writeFile(filePath, nextSource);
	console.log(`Updated ${network} package config`);
}

for (const network of NETWORKS) {
	await updateNetworkConfig(network);
}
