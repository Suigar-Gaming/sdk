// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { play } from '../contracts/coinflip/coinflip.js';
import type { CoinflipTransactionOptions, WithPartner } from '../types/index.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildCoinflipTransaction(
	options: WithPartner<CoinflipTransactionOptions>,
): Transaction {
	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'coinflip',
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
				package: config.packageIds.coinflip,
				typeArguments: [coinType],
				arguments: [
					config.objectIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					options.side === 'tails',
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			}),
	});
}
