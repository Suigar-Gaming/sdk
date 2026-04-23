// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi } from '@mysten/sui/client';
import { BuildTransactionOptions, Transaction } from '@mysten/sui/transactions';
import { toBase64 } from '@mysten/sui/utils';
import {
	BuildCoinflipTransactionOptions,
	BuildGameOptions,
	BuildLimboTransactionOptions,
	BuildPlinkoTransactionOptions,
	BuildPvPCoinflipTransactionOptions,
	BuildRangeTransactionOptions,
	BuildWheelTransactionOptions,
	PvPCoinflipAction,
	StandardGame,
	SUPPORTED_SUI_NETWORKS,
	SuigarConfig,
	SuigarExtensionOptions,
	SuiNetwork,
} from './types';
import { resolveSuigarConfig } from './utils';
import {
	buildCoinflipTransaction,
	buildLimboTransaction,
	buildPlinkoTransaction,
	buildPvPCoinflipTransaction,
	buildRangeTransaction,
	buildWheelTransaction,
} from './transactions';
import { BetResultEvent } from './contracts/core/core';
import {
	GameCancelledEvent,
	GameCreatedEvent,
	GameResolvedEvent,
} from './contracts/pvp-coinflip/pvp_coinflip';

export function suigar<const Name = 'suigar'>({
	name = 'suigar' as Name,
}: SuigarExtensionOptions<Name> = {}) {
	return {
		name,
		register: (client: ClientWithCoreApi) => {
			return new SuigarClient({ client });
		},
	};
}

class SuigarClient {
	#client: ClientWithCoreApi;

	#config: SuigarConfig;

	constructor({ client }: { client: ClientWithCoreApi }) {
		this.#client = client;

		const network = this.#client.network as SuiNetwork;
		if (!SUPPORTED_SUI_NETWORKS.includes(network)) {
			throw new Error(`Unsupported network: ${network}`);
		}

		this.#config = resolveSuigarConfig(network);
	}

	/**
	 * Returns the resolved SDK configuration for the connected network.
	 *
	 * This is primarily useful for debugging or inspecting which package ids,
	 * supported coin types, and price info object ids the SDK resolved for the
	 * current client network.
	 *
	 * @returns Network-resolved Suigar configuration.
	 */
	getConfig() {
		return this.#config;
	}

	/**
	 * Builds a transaction with the configured Sui client and encodes the resulting BCS bytes as base64.
	 *
	 * Use this when an external wallet, API, or transport expects the built transaction payload as a base64 string
	 * instead of raw bytes. The SDK always injects the configured Sui client, so `options` accepts the standard
	 * transaction build options except for `client`.
	 *
	 * @param transaction Transaction to build and serialize.
	 * @param options Optional transaction build options forwarded to `transaction.build()`, excluding `client`.
	 * @returns Base64-encoded transaction bytes ready to send over the wire.
	 */
	async serializeTransactionToBase64(
		transaction: Transaction,
		options?: Omit<BuildTransactionOptions, 'client'>,
	) {
		const bytes = await transaction.build({ ...options, client: this.#client });
		return toBase64(bytes);
	}

	/**
	 * BCS struct constructors for decoding Suigar events emitted on-chain.
	 */
	bcs = {
		/**
		 * Event emitted at the end of a standard game (e.g., Coinflip, Limbo), containing the result and payout information.
		 */
		BetResultEvent,
		/**
		 * Event emitted when a PvP Coinflip game is created, containing the game configuration and initial state.
		 */
		PvPCoinflipGameCreated: GameCreatedEvent,
		/**
		 * Event emitted when a PvP Coinflip game is resolved, containing the final outcome.
		 */
		PvPCoinflipGameResolved: GameResolvedEvent,
		/**
		 * Event emitted when a PvP Coinflip game is cancelled.
		 */
		PvPCoinflipGameCancelled: GameCancelledEvent,
	};

	/**
	 * Transaction builders for Suigar games.
	 */
	tx = {
		/**
		 * Creates a standard game transaction for the provided game id.
		 *
		 * @param gameId Supported standard game identifier.
		 * @param options Transaction builder options for the selected game.
		 * @returns Prepared transaction for the selected game.
		 */
		createBetTransaction: <GameId extends StandardGame>(
			gameId: GameId,
			options: BuildGameOptions<GameId>,
		) => {
			switch (gameId) {
				case 'coinflip':
					return buildCoinflipTransaction({
						...options,
						config: this.#config,
					} as BuildCoinflipTransactionOptions);
				case 'limbo':
					return buildLimboTransaction({
						...options,
						config: this.#config,
					} as BuildLimboTransactionOptions);
				case 'plinko':
					return buildPlinkoTransaction({
						...options,
						config: this.#config,
					} as BuildPlinkoTransactionOptions);
				case 'range':
					return buildRangeTransaction({
						...options,
						config: this.#config,
					} as BuildRangeTransactionOptions);
				case 'wheel':
					return buildWheelTransaction({
						...options,
						config: this.#config,
					} as BuildWheelTransactionOptions);
				default:
					throw new Error(`Unsupported game: ${gameId}`);
			}
		},
		/**
		 * Creates a PvP coinflip transaction for the requested action.
		 *
		 * @param action PvP coinflip action to perform.
		 * @param options Transaction builder options for the selected action.
		 * @returns Prepared PvP coinflip transaction.
		 */
		createPvPCoinflipTransaction: <Action extends PvPCoinflipAction>(
			action: Action,
			options: BuildPvPCoinflipTransactionOptions<Action>,
		) => {
			return buildPvPCoinflipTransaction(action, {
				...options,
				config: this.#config,
			});
		},
	};
}
