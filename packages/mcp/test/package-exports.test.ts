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
});
