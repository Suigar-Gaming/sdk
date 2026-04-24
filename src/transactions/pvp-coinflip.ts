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
	BuildPvPCoinflipTransactionOptions,
	PvPCoinflipAction,
	ResolvedJoinPvPCoinflipTransactionOptions,
	WithPartner,
} from '../types/index.js';
import { resolvePriceInfoObjectId } from '../utils/config.js';
import { encodeBetMetadata } from '../utils/metadata.js';
import { toBigIntAmount } from '../utils/shared.js';
import { createBaseGameTransaction } from './shared.js';

type PvPCoinflipTransactionOptionsWithPartner<
	Action extends PvPCoinflipAction,
> = Action extends 'join'
	? WithPartner<ResolvedJoinPvPCoinflipTransactionOptions>
	: WithPartner<BuildPvPCoinflipTransactionOptions<Action>>;

export function buildPvPCoinflipTransaction<Action extends PvPCoinflipAction>(
	action: Action,
	options: PvPCoinflipTransactionOptionsWithPartner<Action>,
): Transaction {
	const tx = createBaseGameTransaction({
		...options,
		game: 'pvp-coinflip',
	});
	const normalizedCoinType = normalizeStructTag(options.coinType);
	const encodedMetadata = encodeBetMetadata(options.metadata, options.partner);

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
			const joinOptions = options as ResolvedJoinPvPCoinflipTransactionOptions;
			const priceInfoObjectId = resolvePriceInfoObjectId(
				joinOptions.config,
				normalizedCoinType,
			);

			tx.add(
				joinGame({
					package: joinOptions.config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						joinOptions.gameId,
						joinOptions.config.packageIds.sweetHouse,
						tx.add(joinOptions.betCoin),
						encodedMetadata.keys,
						encodedMetadata.values,
						priceInfoObjectId,
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
