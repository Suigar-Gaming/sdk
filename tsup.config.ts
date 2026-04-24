// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'tsup';

export default defineConfig({
	entry: {
		games: 'src/games.ts',
		index: 'src/index.ts',
		utils: 'src/utils/index.ts',
	},
	format: ['esm', 'cjs'],
	dts: true,
	sourcemap: false,
	clean: true,
	target: 'es2022',
	treeshake: true,
});
