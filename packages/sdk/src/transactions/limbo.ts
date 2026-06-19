// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { play } from '../contracts/limbo/limbo.js';
import type {
	BuildLimboTransactionOptions,
	WithPartner,
} from '../types/index.js';
import { DEFAULT_LIMBO_MULTIPLIER_SCALE } from '../utils/index.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildLimboTransaction(
	options: WithPartner<BuildLimboTransactionOptions>,
): Transaction {
	const scale = options.scale ?? DEFAULT_LIMBO_MULTIPLIER_SCALE;
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
			priceInfoObjectId,
			betCoin,
		}) =>
			play({
				package: config.packageIds.limbo,
				typeArguments: [coinType],
				arguments: [
					config.packageIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					BigInt(numerator),
					BigInt(scale),
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			})(tx),
	});
}
