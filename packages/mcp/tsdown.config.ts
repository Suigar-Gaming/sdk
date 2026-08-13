// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'tsdown';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	entry: {
		bin: 'src/bin.ts',
		index: 'src/index.ts',
	},
	define: {
		__SUIGAR_MCP_VERSION__: JSON.stringify(packageJson.version),
	},
	format: 'esm',
	dts: true,
	outDir: 'dist',
	unbundle: true,
});
