// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { play } from '../contracts/wheel/wheel.js';
import type {
	BuildWheelTransactionOptions,
	WithPartner,
} from '../types/index.js';
import { toU8 } from '../utils/index.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildWheelTransaction(
	options: WithPartner<BuildWheelTransactionOptions>,
): Transaction {
	const configId = toU8(options.configId);

	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'wheel',
		buildRewardCoin: ({
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
					config.objectIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					configId,
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			}),
	});
}
