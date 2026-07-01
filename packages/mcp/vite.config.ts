// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
	root: 'src/app',
	build: {
		emptyOutDir: false,
		outDir: '../../dist/app',
	},
	plugins: [viteSingleFile()],
});
