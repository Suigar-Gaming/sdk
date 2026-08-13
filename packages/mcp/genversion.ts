// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises';

interface PackageJson {
	version: string;
}

const packageJsonPath = new URL('./package.json', import.meta.url);
const mcpConfigPath = new URL('./plugin/.mcp.json', import.meta.url);
const serverManifestPath = new URL('./server.json', import.meta.url);
const pluginManifestPaths = [
	new URL('./plugin/plugin.json', import.meta.url),
	new URL('./plugin/.claude-plugin/plugin.json', import.meta.url),
	new URL('./plugin/.codex-plugin/plugin.json', import.meta.url),
	new URL('./plugin/.cursor-plugin/plugin.json', import.meta.url),
];

const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf8')) as PackageJson;
const versionPattern = /^(\s*"version"\s*:\s*")[^"]+(")/m;
const mcpPackagePattern = /("@suigar\/mcp)(?:@[^"]+)?(")/;
const serverPackageVersionPattern =
	/("identifier"\s*:\s*"@suigar\/mcp"\s*,\s*"version"\s*:\s*")[^"]+(")/;

async function replaceInFile(
	filePath: URL,
	pattern: RegExp,
	replacement: string,
	missingMessage: string,
) {
	const source = await readFile(filePath, 'utf8');
	const nextSource = source.replace(pattern, replacement);

	if (nextSource === source && !pattern.test(source)) {
		throw new Error(`${missingMessage} in ${filePath.pathname}`);
	}

	if (nextSource !== source) {
		await writeFile(filePath, nextSource);
	}
}

for (const manifestPath of pluginManifestPaths) {
	await replaceInFile(
		manifestPath,
		versionPattern,
		`$1${packageJson.version}$2`,
		'Missing version field',
	);
}

await replaceInFile(
	mcpConfigPath,
	mcpPackagePattern,
	`$1@${packageJson.version}$2`,
	'Missing @suigar/mcp package specifier',
);

await replaceInFile(
	serverManifestPath,
	versionPattern,
	`$1${packageJson.version}$2`,
	'Missing version field',
);

await replaceInFile(
	serverManifestPath,
	serverPackageVersionPattern,
	`$1${packageJson.version}$2`,
	'Missing @suigar/mcp package version',
);
