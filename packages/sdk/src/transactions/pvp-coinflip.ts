// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { coinWithBalance, Transaction, type TransactionArgument } from '@mysten/sui/transactions';
import { normalizeStructTag } from '@mysten/sui/utils';
import {
	cancelGame,
	createGame,
	joinGameV2,
	Game as PvPCoinflipGame,
} from '../contracts/pvp-coinflip/pvp_coinflip.js';
import { resolvePriceInfoObjectId } from '../helpers/config.js';
import { encodeBetMetadata } from '../helpers/metadata.js';
import type {
	PvPCoinflipAction,
	PvPCoinflipTransactionOptions,
	WithClient,
	WithPartner,
} from '../types/index.js';
import { toBigInt } from '../utils/numeric.js';
import { createBaseTransaction } from './shared.js';

type BuildPvPCoinflipTransactionOptions<TAction extends PvPCoinflipAction = PvPCoinflipAction> = {
	[Action in PvPCoinflipAction]: (Action extends 'join'
		? WithClient<WithPartner<PvPCoinflipTransactionOptions<Action>>>
		: Action extends 'cancel'
			? PvPCoinflipTransactionOptions<Action>
			: WithPartner<PvPCoinflipTransactionOptions<Action>>) & {
		action: Action;
	};
}[TAction];

/**
 * Creates the asynchronous coin-selection thunk used when joining a PvP game.
 *
 * The stake is read from the on-chain game when the transaction is built, which keeps transaction construction compatible with wallet interaction flows.
 */
function buildPvPCoinflipJoinBetCoin(
	options: WithClient<
		Pick<PvPCoinflipTransactionOptions<'join'>, 'gameId' | 'coinType' | 'useGasCoin'>
	>,
): TransactionArgument {
	return async (tx: Transaction) => {
		const { json } = await PvPCoinflipGame.get({
			client: options.client,
			objectId: options.gameId,
		});

		return tx.coin({
			type: options.coinType,
			balance: BigInt(json.stake_per_player),
			useGasCoin: options.useGasCoin,
		});
	};
}

export function buildPvPCoinflipTransaction(
	options: BuildPvPCoinflipTransactionOptions,
): Transaction {
	const tx = createBaseTransaction(options);
	const { config } = options;

	const normalizedCoinType = normalizeStructTag(options.coinType);

	switch (options.action) {
		case 'create': {
			const stake = toBigInt(options.stake);
			const encodedMetadata = encodeBetMetadata(options);

			tx.add(
				createGame({
					package: config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						config.objectIds.sweetHouse,
						coinWithBalance({
							type: normalizedCoinType,
							balance: stake,
							useGasCoin: options.useGasCoin,
						}),
						options.side === 'tails',
						Boolean(options.isPrivate),
						encodedMetadata.keys,
						encodedMetadata.values,
					],
				}),
			);
			return tx;
		}

		case 'join': {
			const encodedMetadata = encodeBetMetadata(options);
			const priceInfoObjectId = resolvePriceInfoObjectId({
				config,
				coinType: normalizedCoinType,
			});

			tx.add(
				joinGameV2({
					package: config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						options.gameId,
						config.objectIds.sweetHouse,
						buildPvPCoinflipJoinBetCoin({
							...options,
							coinType: normalizedCoinType,
						}),
						encodedMetadata.keys,
						encodedMetadata.values,
						priceInfoObjectId,
					],
				}),
			);
			return tx;
		}

		case 'cancel': {
			tx.add(
				cancelGame({
					package: config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [options.gameId, config.objectIds.sweetHouse],
				}),
			);
			return tx;
		}

		default:
			throw new RangeError(
				`Unsupported PvP coinflip action: ${(options as { action?: string })?.action}`,
			);
	}
}
