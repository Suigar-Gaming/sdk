// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiCodegenConfig } from '@mysten/codegen';
import { MOVE_STDLIB_ADDRESS } from '@mysten/sui/utils';
import { SUIGAR_PACKAGES } from './suigar-packages.ts';

const NETWORK = 'testnet';

const SUIGAR_PACKAGES_CONFIGURATION: SuiCodegenConfig['packages'] = SUIGAR_PACKAGES.map(
	(packageInfo) => ({
		package: packageInfo.package,
		packageName: packageInfo.packageName,
		network: NETWORK,
		generate: {
			modules: Object.fromEntries(
				packageInfo.modules.map((moduleInfo) => [
					moduleInfo.module,
					{
						types: moduleInfo.types ?? false,
						functions: moduleInfo.functions ?? { private: 'entry' },
					},
				]),
			),
		},
	}),
);

const config: SuiCodegenConfig = {
	output: './src/contracts',
	includePhantomTypeParameters: false,
	packages: [
		...SUIGAR_PACKAGES_CONFIGURATION,
		{
			package: MOVE_STDLIB_ADDRESS,
			packageName: 'stdlib',
			network: NETWORK,
			generate: {
				modules: {
					type_name: {
						types: ['TypeName'],
					},
				},
			},
		},
	],
	generateSummaries: false,
};

export default config;
