// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { play } from '../contracts/coinflip/coinflip.js';
import type { BuildCoinflipTransactionOptions, WithPartner } from '../types';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildCoinflipTransaction(
	options: WithPartner<BuildCoinflipTransactionOptions>,
): Transaction {
	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'coinflip',
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
				package: config.packageIds.coinflip,
				typeArguments: [coinType],
				arguments: [
					config.packageIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					options.side === 'tails',
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			})(tx),
	});
}
