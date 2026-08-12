// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

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
	PvPCoinflipAction,
	PvPCoinflipTransactionOptions,
	WithBetCoin,
	WithClient,
	WithPartner,
} from '../types/index.js';
import { toBigInt } from '../utils/numeric.js';
import { createBaseGameTransaction } from './shared.js';

type BuildPvPCoinflipTransactionOptions<
	TAction extends PvPCoinflipAction = PvPCoinflipAction,
> = {
	[Action in PvPCoinflipAction]: (Action extends 'join'
		? WithPartner<WithBetCoin<PvPCoinflipTransactionOptions<Action>>>
		: WithPartner<PvPCoinflipTransactionOptions<Action>>) & {
		action: Action;
	};
}[TAction];

/**
 * Creates the asynchronous coin-selection thunk used when joining a PvP game.
 *
 * The stake is read from the on-chain game when the transaction is built, which keeps transaction construction compatible with wallet interaction flows.
 */
export function buildPvPCoinflipJoinBetCoin(
	options: WithClient<
		Pick<
			PvPCoinflipTransactionOptions<'join'>,
			'gameId' | 'coinType' | 'useGasCoin'
		>
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
	const tx = createBaseGameTransaction({
		...options,
		game: 'pvp-coinflip',
	});
	const { config, metadata, partner } = options;

	const normalizedCoinType = normalizeStructTag(options.coinType);
	const encodedMetadata = encodeBetMetadata({
		metadata,
		partner,
	});

	switch (options.action) {
		case 'create': {
			const stake = toBigInt(options.stake);

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
			const priceInfoObjectId = resolvePriceInfoObjectId({
				config,
				coinType: normalizedCoinType,
			});

			tx.add(
				joinGame({
					package: config.packageIds.pvpCoinflip,
					typeArguments: [normalizedCoinType],
					arguments: [
						options.gameId,
						config.objectIds.sweetHouse,
						options.betCoin,
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
