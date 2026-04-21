// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiCodegenConfig } from '@mysten/codegen';
import { SUIGAR_PACKAGES } from './suigar-packages.ts';

const packagesConfiguration: SuiCodegenConfig['packages'] = Object.entries(
	SUIGAR_PACKAGES,
).map(([module, packageInfo]) => ({
	package: packageInfo.package,
	packageName: packageInfo.packageName,
	network: 'testnet',
	generate: {
		modules: {
			[module]: {
				types: packageInfo.types ?? false,
				functions: packageInfo.functions ?? { private: 'entry' },
			},
		},
	},
}));

const config: SuiCodegenConfig = {
	output: './src/contracts',
	includePhantomTypeParameters: true,
	packages: packagesConfiguration,
	generateSummaries: false,
};

export default config;
