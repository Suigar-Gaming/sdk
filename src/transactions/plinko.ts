// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { play } from '../contracts/plinko/plinko.js';
import type { BuildPlinkoTransactionOptions } from '../types';
import { toU8Number } from '../utils/shared.js';

import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildPlinkoTransaction(options: BuildPlinkoTransactionOptions) {
	const configId = toU8Number(options.configId, 'configId');

	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'plinko',
		buildRewardCoin: ({
			tx,
			config,
			coinType,
			stake,
			betCount,
			metadata,
			priceInfoObjectId,
			betCoin,
		}) =>
			play({
				package: config.packageIds.plinko,
				typeArguments: [coinType],
				arguments: [
					config.packageIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					configId,
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			})(tx),
	});
}
