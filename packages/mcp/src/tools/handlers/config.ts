// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	createSuigarClient,
	type ReadConfigResult,
	type ToolTextResult,
} from '../../runtime/index.js';
import type { ReadConfigInput } from '../schemas/index.js';
import {
	asTextResponse,
	getConfigInput,
	supportedFeatures,
	supportedGames,
} from './shared.js';

export async function readConfigTool(
	input: ReadConfigInput = {},
): Promise<ToolTextResult> {
	const { config } = createSuigarClient(getConfigInput(input));
	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
		supportedFeatures: supportedFeatures(),
	} satisfies ReadConfigResult);
}
