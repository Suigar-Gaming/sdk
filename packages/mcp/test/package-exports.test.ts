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

		const manifestUrls = [
			new URL('../plugin/plugin.json', import.meta.url),
			new URL('../plugin/.claude-plugin/plugin.json', import.meta.url),
			new URL('../plugin/.codex-plugin/plugin.json', import.meta.url),
			new URL('../plugin/.cursor-plugin/plugin.json', import.meta.url),
		];
		for (const manifestUrl of manifestUrls) {
			const manifest = JSON.parse(await readFile(manifestUrl, 'utf8'));
			expect(manifest.name).toBe('suigar');
			expect(manifest.version).toBe(packageJson.version);
		}

		const mcpConfig = JSON.parse(
			await readFile(new URL('../plugin/.mcp.json', import.meta.url), 'utf8'),
		);
		expect(mcpConfig).toEqual({
			mcpServers: {
				suigar: {
					command: 'npx',
					args: ['-y', '@suigar/mcp'],
				},
			},
		});

		const codexManifest = JSON.parse(
			await readFile(
				new URL('../plugin/.codex-plugin/plugin.json', import.meta.url),
				'utf8',
			),
		);
		expect(codexManifest.mcpServers).toBe('./.mcp.json');

		const cursorManifest = JSON.parse(
			await readFile(
				new URL('../plugin/.cursor-plugin/plugin.json', import.meta.url),
				'utf8',
			),
		);
		expect(cursorManifest.mcpServers).toBe('./.mcp.json');
	});
});
