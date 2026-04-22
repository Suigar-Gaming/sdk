// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { play } from '../contracts/wheel/wheel.js';
import type { BuildWheelTransactionOptions } from '../types';
import { toU8Number } from '../utils/shared.js';

import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildWheelTransaction(options: BuildWheelTransactionOptions) {
	const configId = toU8Number(options.configId, 'configId');

	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'wheel',
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
				package: config.packageIds.wheel,
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
