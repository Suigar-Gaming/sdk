// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

const packageJson = JSON.parse(
	readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
) as { version: string };

export default defineConfig({
	root: 'src/app',
	build: {
		emptyOutDir: false,
		outDir: '../../dist/app',
	},
	define: {
		__SUIGAR_MCP_APP_VERSION__: JSON.stringify(packageJson.version),
	},
	plugins: [react(), tailwindcss(), viteSingleFile()],
});
