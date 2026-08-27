// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { playV2 } from '../contracts/soccer/soccer.js';
import type { SoccerTransactionOptions, WithPartner } from '../types/index.js';
import { toU8, toU16 } from '../utils/numeric.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildSoccerTransaction(
	options: WithPartner<SoccerTransactionOptions>,
): Transaction {
	const configId = toU8(options.configId);
	const countryId = toU16(options.countryId);
	const shotZoneId = toU8(options.shotZoneId);

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
				package: config.packageIds.soccer,
				typeArguments: [coinType],
				arguments: [
					config.objectIds.sweetHouse,
					stake,
					betCoin,
					betCount,
					configId,
					countryId,
					shotZoneId,
					metadata.keys,
					metadata.values,
					priceInfoObjectId,
				],
			}),
	});
}
