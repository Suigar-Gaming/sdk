// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { play } from '../contracts/range/range.js';
import type { BuildRangeTransactionOptions, WithPartner } from '../types';
import { RANGE_FIXED_POINT_SCALE } from '../utils/shared.js';

import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildRangeTransaction(
	options: WithPartner<BuildRangeTransactionOptions>,
) {
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
			priceInfoObjectId,
			betCoin,
		}) =>
			play({
				package: config.packageIds.range,
				typeArguments: [coinType],
				arguments: [
					config.packageIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					BigInt(leftPoint),
					BigInt(rightPoint),
					Boolean(options.outOfRange),
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			})(tx),
	});
}
