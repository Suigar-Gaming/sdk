// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'vitest/config';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
	define: {
		__SUIGAR_MCP_VERSION__: packageJson.version,
	},
	test: {
		environment: 'node',
		include: ['test/**/*.{test,spec}.?(c|m)[jt]s?(x)'],
	},
});
