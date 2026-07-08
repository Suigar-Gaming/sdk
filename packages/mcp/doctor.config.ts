// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'react-doctor/api';

export default defineConfig({
	blocking: 'warning',
	share: false,
	noScore: true,
	rules: {
		'deslop/unused-dependency': 'off',
		'deslop/unused-file': 'off',
	},
	ignore: {
		files: ['src/!(app){,/**/*}', 'test/**/*'],
	},
});
