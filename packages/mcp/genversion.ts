// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises';

interface PackageJson {
	version: string;
}

const packageJsonPath = new URL('./package.json', import.meta.url);
const pluginManifestPaths = [
	new URL('./plugin/plugin.json', import.meta.url),
	new URL('./plugin/.claude-plugin/plugin.json', import.meta.url),
	new URL('./plugin/.codex-plugin/plugin.json', import.meta.url),
	new URL('./plugin/.cursor-plugin/plugin.json', import.meta.url),
];

const packageJson = JSON.parse(
	await readFile(packageJsonPath, 'utf8'),
) as PackageJson;
const versionPattern = /^(\s*"version"\s*:\s*")[^"]+(")/m;

for (const manifestPath of pluginManifestPaths) {
	const manifestSource = await readFile(manifestPath, 'utf8');
	const nextManifestSource = manifestSource.replace(
		versionPattern,
		`$1${packageJson.version}$2`,
	);

	if (
		nextManifestSource === manifestSource &&
		!versionPattern.test(manifestSource)
	) {
		throw new Error(`Missing version field in ${manifestPath.pathname}`);
	}

	if (nextManifestSource !== manifestSource) {
		await writeFile(manifestPath, nextManifestSource);
	}
}
