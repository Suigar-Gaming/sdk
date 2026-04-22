// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag } from '@mysten/sui/utils';

import {
	cancelGame,
	createGame,
	joinGame,
} from '../contracts/pvp-coinflip/pvp_coinflip.js';
import type {
	BuildCancelPvPCoinflipTransactionOptions,
	BuildCreatePvPCoinflipTransactionOptions,
	BuildJoinPvPCoinflipTransactionOptions,
	BuildPvPCoinflipTransactionOptions,
	PvPCoinflipAction,
} from '../types/index.js';
import { encodeBetMetadata } from '../utils/metadata.js';
import { toBigIntAmount } from '../utils/shared.js';
import { createBaseGameTransaction } from './shared.js';

export function buildPvPCoinflipTransaction<Action extends PvPCoinflipAction>(
	action: Action,
	options: BuildPvPCoinflipTransactionOptions<Action>,
): Transaction {
	const tx = createBaseGameTransaction({
		...options,
		game: 'pvp-coinflip',
	});
	const normalizedCoinType = normalizeStructTag(options.coinType);
	const encodedMetadata = encodeBetMetadata(options.metadata);

	switch (action) {
		case 'create': {
			const createOptions = options as BuildCreatePvPCoinflipTransactionOptions;
			const stake = toBigIntAmount(createOptions.stake, 'stake');
			const betCoin = tx.coin({
				type: normalizedCoinType,
				balance: stake,
				useGasCoin: createOptions.allowGasCoinShortcut,
			});

			tx.add(
				createGame({
					package: createOptions.config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						createOptions.config.packageIds.sweetHouse,
						betCoin,
						createOptions.side === 'tails',
						Boolean(createOptions.isPrivate),
						encodedMetadata.keys,
						encodedMetadata.values,
					],
				}),
			);
			return tx;
		}

		case 'join': {
			const joinOptions = options as BuildJoinPvPCoinflipTransactionOptions;
			const stake = toBigIntAmount(joinOptions.stake, 'stake');
			const betCoin = tx.coin({
				type: normalizedCoinType,
				balance: stake,
				useGasCoin: joinOptions.allowGasCoinShortcut,
			});

			tx.add(
				joinGame({
					package: joinOptions.config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						joinOptions.gameId,
						joinOptions.config.packageIds.sweetHouse,
						betCoin,
						encodedMetadata.keys,
						encodedMetadata.values,
						joinOptions.extraObjectId,
					],
				}),
			);
			return tx;
		}

		case 'cancel': {
			const cancelOptions = options as BuildCancelPvPCoinflipTransactionOptions;

			tx.add(
				cancelGame({
					package: cancelOptions.config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						cancelOptions.gameId,
						cancelOptions.config.packageIds.sweetHouse,
					],
				}),
			);
			return tx;
		}

		default:
			throw new Error(`Unsupported PvP coinflip action: ${action}`);
	}
}
