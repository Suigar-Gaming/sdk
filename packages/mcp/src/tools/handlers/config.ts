// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	createSuigarClient,
	type ReadConfigResult,
} from '../../runtime/index.js';
import type { ReadConfigInput } from '../schemas/index.js';
import {
	asTextResponse,
	getConfigInput,
	supportedFeatures,
	supportedGames,
} from './shared.js';

export const readConfigTool = async (input: ReadConfigInput = {}) => {
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
		supportedFeatures: supportedFeatures(),
	} satisfies ReadConfigResult);
};
