// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'tsdown';

export default defineConfig({
	entry: {
		games: 'src/games.ts',
		index: 'src/index.ts',
		utils: 'src/utils/index.ts',
	},
	format: 'esm',
	target: 'es2022',
	unbundle: true,
});
