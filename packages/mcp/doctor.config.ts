// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'react-doctor/api';

export default defineConfig({
	blocking: 'warning',
	// React Doctor runs against the bundled Vite MCP App. The Node MCP server
	// is covered by the package's TypeScript, oxlint, and Vitest checks.
	rootDir: 'src/app',
	share: false,
	noScore: true,
	rules: {
		// The MCP package uses NodeNext ESM source imports with emitted `.js`
		// specifiers, which React Doctor's wrapper reports as missing extensions.
		'import/extensions': 'off',
	},
});
