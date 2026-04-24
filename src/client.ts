// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import { BuildTransactionOptions, Transaction } from '@mysten/sui/transactions';
import {
	normalizeStructTag,
	parseStructTag,
	toBase64,
} from '@mysten/sui/utils';
import {
	BuildCoinflipTransactionOptions,
	BuildCancelPvPCoinflipTransactionOptions,
	BuildCreatePvPCoinflipTransactionOptions,
	BuildGameOptions,
	BuildJoinPvPCoinflipTransactionOptions,
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
	WithPartner,
} from './types';
import { resolveSuigarConfig } from './helpers/index.js';
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
	Game,
	GameCancelledEvent,
	GameCreatedEvent,
	GameResolvedEvent,
} from './contracts/pvp-coinflip/pvp_coinflip';

export function suigar<const Name = 'suigar'>({
	name = 'suigar' as Name,
	partner,
}: SuigarExtensionOptions<Name> = {}) {
	return {
		name,
		register: (client: ClientWithCoreApi) => {
			return new SuigarClient({ client, partner });
		},
	};
}

export class SuigarClient {
	#client: ClientWithCoreApi;

	#config: SuigarConfig;

	#partner: string | undefined;

	constructor({
		client,
		partner,
	}: {
		client: ClientWithCoreApi;
		partner?: string;
	}) {
		this.#client = client;
		this.#partner = partner;

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

	async getPvPCoinflipGames(
		options: Omit<SuiClientTypes.ListDynamicFieldsOptions, 'parentId'> = {
			limit: 50,
		},
	) {
		const { dynamicFields } = await this.#client.core.listDynamicFields({
			parentId: this.#config.packageIds.pvpCoinflip,
			...options,
		});

		return await Promise.all(
			dynamicFields.map(({ childId }) => this.resolvePvPConflipGame(childId)),
		);
	}

	/**
	 * Fetches and parses a PvP coinflip game object from chain.
	 *
	 * This resolves the raw object through the configured client, requires the
	 * object's `content` to be present, and decodes that content with the
	 * generated `PvPCoinflipGame` BCS parser.
	 *
	 * @param gameId On-chain object id of the PvP coinflip game.
	 * @returns Parsed PvP coinflip game state.
	 * @throws Error If the object cannot be decoded because no content was returned.
	 */
	async resolvePvPConflipGame(gameId: string) {
		const { object } = await this.#client.core.getObject({
			objectId: gameId,
			include: { content: true },
		});

		if (!object.content) {
			throw new Error('Unable to resolve PvP coinflip from game object');
		}

		return {
			...Game.parse(object.content),
			coinType: normalizeStructTag(parseStructTag(object.type).typeParams[0]),
		};
	}

	/**
	 * BCS struct constructors for decoding on-chain objects and events related to Suigar games.
	 *
	 * These can be used to parse the `content` field of on-chain objects and events into structured data with the
	 * expected types. For example, use `client.suigar.bcs.PvPCoinflipGame.parse(object.content)` to decode a PvP
	 * coinflip game object.
	 *
	 * Note that these constructors are not meant for encoding transaction arguments, as the SDK's transaction
	 * builders handle argument serialization internally. Use these primarily for decoding and parsing on-chain data.
	 */
	bcs = {
		// Objects
		/**
		 * Object representing the state of a PvP coinflip game, as stored on-chain.
		 */
		PvPCoinflipGame: Game,
		// Events
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
						partner: this.#partner,
					} as WithPartner<BuildCoinflipTransactionOptions>);
				case 'limbo':
					return buildLimboTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					} as WithPartner<BuildLimboTransactionOptions>);
				case 'plinko':
					return buildPlinkoTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					} as WithPartner<BuildPlinkoTransactionOptions>);
				case 'range':
					return buildRangeTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					} as WithPartner<BuildRangeTransactionOptions>);
				case 'wheel':
					return buildWheelTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					} as WithPartner<BuildWheelTransactionOptions>);
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
			switch (action) {
				case 'create':
					return buildPvPCoinflipTransaction('create', {
						...(options as BuildCreatePvPCoinflipTransactionOptions),
						config: this.#config,
						partner: this.#partner,
					});
				case 'join': {
					const joinOptions = options as BuildJoinPvPCoinflipTransactionOptions;
					return buildPvPCoinflipTransaction('join', {
						...joinOptions,
						betCoin: this.#createPvPCoinflipBetCoin(joinOptions),
						config: this.#config,
						partner: this.#partner,
					});
				}
				case 'cancel':
					return buildPvPCoinflipTransaction('cancel', {
						...(options as BuildCancelPvPCoinflipTransactionOptions),
						config: this.#config,
						partner: this.#partner,
					});
				default:
					throw new Error(`Unsupported PvP coinflip action: ${action}`);
			}
		},
	};

	#createPvPCoinflipBetCoin(options: BuildJoinPvPCoinflipTransactionOptions) {
		return async (tx: Transaction) => {
			const { stake_per_player } = await this.resolvePvPConflipGame(
				options.gameId,
			);
			return tx.coin({
				type: options.coinType,
				balance: BigInt(stake_per_player),
				useGasCoin: options.allowGasCoinShortcut,
			});
		};
	}
}
