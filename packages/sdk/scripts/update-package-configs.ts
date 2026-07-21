// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SuiGrpcClient } from '@mysten/sui/grpc';

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
	keyof typeof REGISTRY_PACKAGE_NAMES | 'legacyNft' | 'soccer',
	string
>;
type ObjectIds = Record<'sweetHouse' | 'legacyNftFactory', string>;
type CoinMetadataSource = {
	coinType: string;
	decimals: string;
	priceInfoObjectId: string;
};
type CoinKey = 'sui' | 'usdc';
type CoinMetadataSources = Record<CoinKey, CoinMetadataSource>;

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
		`${key}:\\s*\\{[\\s\\S]*?coinType:\\s*([^,\\n]+),[\\s\\S]*?decimals:\\s*([^,\\n]+),[\\s\\S]*?priceInfoObjectId:\\s*'([^']*)',[\\s\\S]*?\\}`,
	);
	const entryMatch = blockMatch[1].match(entryPattern);

	if (!entryMatch) {
		throw new Error(`Could not find coin metadata for ${key} in ${objectName}`);
	}

	return {
		coinType: entryMatch[1].trim(),
		decimals: entryMatch[2].trim(),
		priceInfoObjectId: entryMatch[3].trim(),
	};
}

function getNetworkConfigDirectoryPath(network: Network) {
	return path.join(rootDir, `src/configs/${network}`);
}

function getNetworkRpcUrl(network: Network) {
	return `https://fullnode.${network}.sui.io:443`;
}

function createNetworkClient(network: Network) {
	return new SuiGrpcClient({
		baseUrl: getNetworkRpcUrl(network),
		network,
	});
}

async function assertObjectType({
	client,
	objectId,
	expectedType,
}: {
	client: SuiGrpcClient;
	objectId: string;
	expectedType: string;
}) {
	const { object } = await client.core.getObject({ objectId });

	if (object.type !== expectedType) {
		throw new Error(
			`Expected ${objectId} to have type ${expectedType}, received ${object.type}`,
		);
	}
}

function renderNetworkFiles(
	network: Network,
	{
		packageIds,
		objectIds,
		coins,
	}: {
		packageIds: PackageIds;
		objectIds: ObjectIds;
		coins: CoinMetadataSources;
	},
) {
	const isMainnet = network === 'mainnet';

	return {
		packages: `// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarPackageIds } from '../../types/suigar-config.type.js';

// \`legacyNft\` and \`soccer\` are preserved manually because they are not resolved from MVR.
export const PACKAGE_IDS: SuigarPackageIds = {
\tcore: '${packageIds.core}',
\tlegacyNft:
\t\t'${packageIds.legacyNft}',
\tcoinflip:
\t\t'${packageIds.coinflip}',
\tlimbo: '${packageIds.limbo}',
\tplinko: '${packageIds.plinko}',
\tpvpCoinflip:
\t\t'${packageIds.pvpCoinflip}',
\trange: '${packageIds.range}',
\tsoccer:
\t\t'${packageIds.soccer}',
\twheel: '${packageIds.wheel}',
};
`,
		objects: `// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuigarObjectIds } from '../../types/suigar-config.type.js';

export const OBJECT_IDS: SuigarObjectIds = {
\tsweetHouse:
\t\t'${objectIds.sweetHouse}',
\tlegacyNftFactory:
\t\t'${objectIds.legacyNftFactory}',
};
`,
		coins: `// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

${isMainnet ? "import { SUI_DECIMALS, SUI_TYPE_ARG } from '@mysten/sui/utils';\n" : ''}import type { SuigarCoinRegistry } from '../../types/suigar-config.type.js';

export const COINS: SuigarCoinRegistry = {
\tsui: {
\t\tcoinType: ${isMainnet ? 'SUI_TYPE_ARG' : coins.sui.coinType},
\t\tdecimals: ${isMainnet ? 'SUI_DECIMALS' : coins.sui.decimals},
\t\tpriceInfoObjectId: '${coins.sui.priceInfoObjectId}',
\t},
\tusdc: {
\t\tcoinType: ${coins.usdc.coinType},
\t\tdecimals: ${coins.usdc.decimals},
\t\tpriceInfoObjectId: '${coins.usdc.priceInfoObjectId}',
\t},
};
`,
	};
}

async function updateNetworkConfig(network: Network) {
	const configDirectoryPath = getNetworkConfigDirectoryPath(network);
	const client = createNetworkClient(network);
	const [packageSource, objectSource, coinSource] = await Promise.all([
		readFile(path.join(configDirectoryPath, 'packages.ts'), 'utf8'),
		readFile(path.join(configDirectoryPath, 'objects.ts'), 'utf8'),
		readFile(path.join(configDirectoryPath, 'coins.ts'), 'utf8'),
	]);
	const currentPackageObjectName = 'PACKAGE_IDS';
	const currentObjectObjectName = 'OBJECT_IDS';
	const currentCoinsObjectName = 'COINS';

	const packageIds: PackageIds = {
		legacyNft: extractObjectValue(
			packageSource,
			currentPackageObjectName,
			'legacyNft',
		),
		soccer: extractObjectValue(
			packageSource,
			currentPackageObjectName,
			'soccer',
		),
		core: '',
		coinflip: '',
		limbo: '',
		plinko: '',
		pvpCoinflip: '',
		range: '',
		wheel: '',
	};
	const objectIds: ObjectIds = {
		sweetHouse: extractObjectValue(
			objectSource,
			currentObjectObjectName,
			'sweetHouse',
		),
		legacyNftFactory: extractObjectValue(
			objectSource,
			currentObjectObjectName,
			'legacyNftFactory',
		),
	};

	for (const [packageKey, packageName] of Object.entries(
		REGISTRY_PACKAGE_NAMES,
	) as Array<[keyof typeof REGISTRY_PACKAGE_NAMES, string]>) {
		packageIds[packageKey] = (
			await client.core.mvr.resolvePackage({ package: packageName })
		).package;
	}

	await assertObjectType({
		client,
		objectId: objectIds.sweetHouse,
		expectedType: `${packageIds.core}::sweethouse::SweetHouse`,
	});
	await assertObjectType({
		client,
		objectId: objectIds.legacyNftFactory,
		expectedType: `${packageIds.legacyNft}::nft::Factory`,
	});

	const coins: CoinMetadataSources = {
		sui: extractCoinMetadata(coinSource, currentCoinsObjectName, 'sui'),
		usdc: extractCoinMetadata(coinSource, currentCoinsObjectName, 'usdc'),
	};

	const nextFiles = renderNetworkFiles(network, {
		packageIds,
		objectIds,
		coins,
	});

	await mkdir(configDirectoryPath, { recursive: true });
	await Promise.all([
		writeFile(
			path.join(configDirectoryPath, 'packages.ts'),
			nextFiles.packages,
		),
		writeFile(path.join(configDirectoryPath, 'objects.ts'), nextFiles.objects),
		writeFile(path.join(configDirectoryPath, 'coins.ts'), nextFiles.coins),
	]);
	console.log(`Updated ${network} package configuration`);
}

for (const network of NETWORKS) {
	await updateNetworkConfig(network);
}
