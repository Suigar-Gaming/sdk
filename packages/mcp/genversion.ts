// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile, writeFile } from 'node:fs/promises';

interface PackageJson {
	version: string;
}

interface PluginManifest {
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

for (const manifestPath of pluginManifestPaths) {
	const manifest = JSON.parse(
		await readFile(manifestPath, 'utf8'),
	) as PluginManifest;
	manifest.version = packageJson.version;
	await writeFile(manifestPath, `${JSON.stringify(manifest, null, '\t')}\n`);
}
