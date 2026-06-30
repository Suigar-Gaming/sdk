// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
	build: {
		emptyOutDir: false,
		outDir: 'dist/app',
		rollupOptions: {
			input: 'src/app/index.html',
		},
	},
	plugins: [viteSingleFile()],
});
