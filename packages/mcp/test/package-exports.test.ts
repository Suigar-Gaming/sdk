// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFile } from 'node:fs/promises';

import { describe, expect, it } from 'vitest';

import packageJson from '../package.json' with { type: 'json' };

describe('package exports', () => {
	it('exposes only the package root as the public import path', () => {
		expect(Object.keys(packageJson.exports).sort()).toEqual(['.']);
		expect(packageJson.exports['.']).toEqual({
			types: './dist/index.d.mts',
			import: './dist/index.mjs',
			default: './dist/index.mjs',
		});
	});

	it('keeps the root source entrypoint limited to server helpers', async () => {
		const source = await readFile(new URL('../src/index.ts', import.meta.url), {
			encoding: 'utf8',
		});

		expect(source).toContain("from './server/index.js';");
		expect(source).not.toContain("export * from './tools/");
		expect(source).not.toContain("export * from './runtime/");
		expect(source).not.toContain("export type * from './runtime/");
	});

	it('ships synchronized plugin manifests and MCP server config', async () => {
		expect(packageJson.files).toContain('plugin');
		expect(packageJson.files).not.toContain('server.json');
		expect(packageJson.mcpName).toBe('io.github.Suigar-Gaming/mcp');

		const serverManifest = JSON.parse(
			await readFile(new URL('../server.json', import.meta.url), 'utf8'),
		);
		expect(serverManifest).toMatchObject({
			$schema: 'https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json',
			name: packageJson.mcpName,
			version: packageJson.version,
			repository: {
				url: 'https://github.com/Suigar-Gaming/ts-sdks',
				source: 'github',
			},
			packages: [
				{
					registryType: 'npm',
					identifier: packageJson.name,
					version: packageJson.version,
					transport: { type: 'stdio' },
					environmentVariables: [
						{
							name: 'SUIGAR_MCP_BRIDGE_WEB_URL',
							isRequired: false,
							format: 'string',
							isSecret: false,
						},
						{
							name: 'SUIGAR_MCP_BRIDGE_TIMEOUT_MS',
							isRequired: false,
							format: 'string',
							isSecret: false,
						},
						{
							name: 'SUIGAR_MCP_BRIDGE_MAX_BODY_BYTES',
							isRequired: false,
							format: 'string',
							isSecret: false,
						},
						{
							name: 'SUIGAR_MCP_SESSION_SETUP_TIMEOUT_MS',
							isRequired: false,
							format: 'string',
							isSecret: false,
						},
					],
				},
			],
		});

		const manifestUrls = [
			new URL('../plugin/plugin.json', import.meta.url),
			new URL('../plugin/.claude-plugin/plugin.json', import.meta.url),
			new URL('../plugin/.codex-plugin/plugin.json', import.meta.url),
			new URL('../plugin/.cursor-plugin/plugin.json', import.meta.url),
		];
		for (const manifestUrl of manifestUrls) {
			const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
			expect(manifest.name).toBe('suigar-mcp');
			expect(manifest.version).toBe(packageJson.version);
			expect(manifest.license).toBe('Apache-2.0');
		}

		const mcpConfig = JSON.parse(
			await readFile(new URL('../plugin/.mcp.json', import.meta.url), 'utf8'),
		);
		await expect(
			readFile(new URL('../plugin/assets/logo.svg', import.meta.url), 'utf8'),
		).resolves.toContain('<svg');
		await expect(
			readFile(new URL('../plugin/assets/logo.png', import.meta.url)),
		).resolves.toBeInstanceOf(Buffer);
		expect(mcpConfig).toEqual({
			mcpServers: {
				suigar: {
					command: 'npx',
					args: ['-y', `@suigar/mcp@${packageJson.version}`],
				},
			},
		});

		const codexManifest = JSON.parse(
			await readFile(new URL('../plugin/.codex-plugin/plugin.json', import.meta.url), 'utf8'),
		);
		expect(codexManifest.mcpServers).toBe('./.mcp.json');
		expect(codexManifest.interface.composerIcon).toBe('./assets/logo.png');
		expect(codexManifest.interface.logo).toBe('./assets/logo.svg');

		const cursorManifest = JSON.parse(
			await readFile(new URL('../plugin/.cursor-plugin/plugin.json', import.meta.url), 'utf8'),
		);
		expect(cursorManifest.mcpServers).toBe('./.mcp.json');
		expect(cursorManifest.logo).toBe('./assets/logo.svg');
		expect(cursorManifest.displayName).toBe('Suigar MCP');
	});
});
