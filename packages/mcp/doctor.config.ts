// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { defineConfig } from 'react-doctor/api';

export default defineConfig({
	blocking: 'warning',
	share: false,
	noScore: true,
	rules: {
		'deslop/unused-dependency': 'off',
	},
	ignore: {
		overrides: [
			{
				files: ['src/app/**/*'],
				rules: ['deslop/unused-file'],
			},
			{
				files: ['src/**/*', '!src/app/**/*'],
				rules: ['react-doctor/no-barrel-import'],
			},
		],
	},
});
