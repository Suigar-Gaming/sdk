// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	root: 'src/app',
	build: {
		emptyOutDir: false,
		outDir: '../../dist/app',
	},
	define: {
		__SUIGAR_MCP_APP_VERSION__: packageJson.version,
	},
	plugins: [react(), tailwindcss(), viteSingleFile()],
});
