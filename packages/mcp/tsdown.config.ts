// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		bin: 'src/bin.ts',
		index: 'src/index.ts',
	},
	format: 'esm',
	dts: true,
	outDir: 'dist',
	unbundle: true,
});
