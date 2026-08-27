// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { playV2 } from '../contracts/plinko/plinko.js';
import type { PlinkoTransactionOptions, WithPartner } from '../types/index.js';
import { toU8 } from '../utils/numeric.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildPlinkoTransaction(
	options: WithPartner<PlinkoTransactionOptions>,
): Transaction {
	const configId = toU8(options.configId);

	return buildSharedStandardGameBetTransaction({
		...options,
		buildRewardCoin: ({
			config,
			coinType,
			stake,
			betCount,
			metadata,
			priceInfoObjectId,
			betCoin,
		}) =>
			playV2({
				package: config.packageIds.plinko,
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
