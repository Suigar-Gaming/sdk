// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { playV2 } from '../contracts/keno/keno.js';
import type { KenoTransactionOptions, WithPartner } from '../types/index.js';
import { toU8 } from '../utils/numeric.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildKenoTransaction(options: WithPartner<KenoTransactionOptions>): Transaction {
	const configId = toU8(options.configId);
	const picks = options.picks.map((pick) => toU8(pick));

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
				package: config.packageIds.keno,
				typeArguments: [coinType],
				arguments: [
					config.objectIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					configId,
					picks,
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			}),
	});
}
