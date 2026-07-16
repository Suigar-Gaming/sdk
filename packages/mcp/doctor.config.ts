// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'react-doctor/api';

export default defineConfig({
	blocking: 'warning',
	share: false,
	noScore: true,
	rules: {
		'deslop/unused-file': 'off',
		// The MCP package uses NodeNext ESM source imports with emitted `.js`
		// specifiers, which React Doctor's wrapper reports as missing extensions.
		'import/extensions': 'off',
	},
	ignore: {
		files: ['src/!(app){,/**/*}', 'test/**/*'],
	},
});
