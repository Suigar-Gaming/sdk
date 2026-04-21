// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { play } from '../contracts/limbo/limbo.js';
import type { BuildLimboTransactionOptions } from '../types';
import { LIMBO_MULTIPLIER_SCALE } from '../utils/shared.js';

import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildLimboTransaction(options: BuildLimboTransactionOptions) {
	const scale = options.scale ?? LIMBO_MULTIPLIER_SCALE;
	const numerator = Math.round(options.targetMultiplier * scale);

	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'limbo',
		buildRewardCoin: ({
			tx,
			config,
			coinType,
			stake,
			betCount,
			metadata,
			pythPriceInfoObjectId,
			betCoin,
		}) =>
			play({
				package: config.gamesPackageId.limbo,
				typeArguments: [coinType],
				arguments: [
					config.sweetHousePackageId,
					stake,
					betCoin,
					betCount,
					BigInt(numerator),
					BigInt(scale),
					metadata.keys,
					metadata.values,
					pythPriceInfoObjectId,
				],
			})(tx),
	});
}
