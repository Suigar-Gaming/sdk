// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi } from '@mysten/sui/client';
import {
	coinWithBalance,
	Transaction,
	type TransactionArgument,
} from '@mysten/sui/transactions';
import { normalizeStructTag } from '@mysten/sui/utils';
import {
	cancelGame,
	createGame,
	joinGame,
	Game as PvPCoinflipGame,
} from '../contracts/pvp-coinflip/pvp_coinflip.js';
import { resolvePriceInfoObjectId } from '../helpers/config.js';
import { encodeBetMetadata } from '../helpers/metadata.js';
import type {
	CancelPvPCoinflipTransactionOptions,
	CreatePvPCoinflipTransactionOptions,
	PvPCoinflipAction,
	PvPCoinflipTransactionOptions,
	ResolvedJoinPvPCoinflipTransactionOptions,
	WithPartner,
} from '../types/index.js';
import { toBigInt } from '../utils/numeric.js';
import { moveCoinWithBalanceCleanupBeforeRandom } from './coin-with-balance-random.js';
import { createBaseGameTransaction } from './shared.js';

type PvPCoinflipTransactionOptionsWithPartner<
	Action extends PvPCoinflipAction,
> = Action extends 'join'
	? WithPartner<ResolvedJoinPvPCoinflipTransactionOptions>
	: WithPartner<PvPCoinflipTransactionOptions<Action>>;

/**
 * Creates the asynchronous coin-selection thunk used when joining a PvP game.
 *
 * The stake is read from the on-chain game when the transaction is built, which
 * keeps transaction construction compatible with wallet interaction flows.
 */
export function buildPvPCoinflipJoinBetCoin(
	client: ClientWithCoreApi,
	options: Pick<
		PvPCoinflipTransactionOptions<'join'>,
		'gameId' | 'coinType' | 'useGasCoin'
	>,
): TransactionArgument {
	return async (tx: Transaction) => {
		const { json } = await PvPCoinflipGame.get({
			client,
			objectId: options.gameId,
		});

		return tx.coin({
			type: options.coinType,
			balance: BigInt(json.stake_per_player),
			useGasCoin: options.useGasCoin,
		});
	};
}

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
			const createOptions = options as CreatePvPCoinflipTransactionOptions;
			const stake = toBigInt(createOptions.stake);

			tx.add(
				createGame({
					package: createOptions.config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						createOptions.config.objectIds.sweetHouse,
						coinWithBalance({
							type: normalizedCoinType,
							balance: stake,
							useGasCoin: createOptions.useGasCoin,
						}),
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
						joinOptions.config.objectIds.sweetHouse,
						joinOptions.betCoin,
						encodedMetadata.keys,
						encodedMetadata.values,
						priceInfoObjectId,
					],
				}),
			);
			moveCoinWithBalanceCleanupBeforeRandom(tx);
			return tx;
		}

		case 'cancel': {
			const cancelOptions = options as CancelPvPCoinflipTransactionOptions;

			tx.add(
				cancelGame({
					package: cancelOptions.config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						cancelOptions.gameId,
						cancelOptions.config.objectIds.sweetHouse,
					],
				}),
			);
			return tx;
		}

		default:
			throw new RangeError(`Unsupported PvP coinflip action: ${action}`);
	}
}
