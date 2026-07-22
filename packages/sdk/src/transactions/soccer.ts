// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { play } from '../contracts/soccer/soccer.js';
import type {
	BuildSoccerTransactionOptions,
	WithPartner,
} from '../types/transaction-options.type.js';
import { toU8, toU16 } from '../utils/numeric.js';
import { buildSharedStandardGameBetTransaction } from './shared.js';

export function buildSoccerTransaction(
	options: WithPartner<BuildSoccerTransactionOptions>,
): Transaction {
	const configId = toU8(options.configId);
	const countryId = toU16(options.countryId);
	const shotZoneId = toU8(options.shotZoneId);

	return buildSharedStandardGameBetTransaction({
		...options,
		game: 'soccer',
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
