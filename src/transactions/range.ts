// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { play } from '../contracts/range/range.js';
import type { BuildRangeTransactionOptions } from '../types';
import { RANGE_FIXED_POINT_SCALE } from '../utils/shared.js';

import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildRangeTransaction(options: BuildRangeTransactionOptions) {
	const scale = options.scale ?? RANGE_FIXED_POINT_SCALE;
	const leftPoint = Math.round(options.leftPoint * scale);
	const rightPoint = Math.round(options.rightPoint * scale);

	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'range',
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
				package: config.gamesPackageId.range,
				typeArguments: [coinType],
				arguments: [
					config.sweetHousePackageId,
					stake,
					betCoin,
					betCount,
					BigInt(leftPoint),
					BigInt(rightPoint),
					Boolean(options.outOfRange),
					metadata.keys,
					metadata.values,
					pythPriceInfoObjectId,
				],
			})(tx),
	});
}
