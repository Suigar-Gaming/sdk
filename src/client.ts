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
	WithThrowOnError,
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
	Game as PvPCoinflipGame,
	GameCancelledEvent as PvPCoinflipGameCancelledEvent,
	GameCreatedEvent as PvPCoinflipGameCreatedEvent,
	GameResolvedEvent as PvPCoinflipGameResolvedEvent,
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

	/**
	 * Lists unresolved PvP coinflip games from the configured registry and resolves
	 * each entry into parsed onchain game state.
	 *
	 * This fetches dynamic fields from the PvP coinflip registry object, then bulk
	 * loads the referenced game objects through `client.core.getObjects()`. Registry
	 * membership is the unresolved-state signal: when a game is joined and resolved,
	 * the Move flow removes it from the registry and deletes the live `Game` object.
	 * Use this when a product needs the current set of open PvP coinflip matches for
	 * browsing or lobby views.
	 *
	 * @param options Optional dynamic field pagination forwarded to `listDynamicFields()`, excluding `parentId`.
	 * Pass `throwOnError: true` to fail the whole lookup when any referenced game
	 * cannot be resolved. By default, failed game resolutions are skipped and only
	 * successfully parsed unresolved games are returned.
	 * @returns Parsed unresolved PvP coinflip game objects for the requested
	 * registry page. When `throwOnError` is `false`, entries that fail
	 * `resolvePvPConflipGame()` are omitted from the returned array.
	 */
	async getPvPCoinflipGames(
		options: WithThrowOnError<
			Omit<SuiClientTypes.ListDynamicFieldsOptions, 'parentId'>
		> = {
			limit: 50,
		},
	) {
		const { throwOnError = false, ...listOptions } = options;
		const { dynamicFields } = await this.#client.core.listDynamicFields({
			...listOptions,
			parentId: this.#config.registryIds.pvpCoinflip,
		});

		const { objects } = await this.#client.core.getObjects({
			objectIds: dynamicFields.map(({ childId }) => childId),
			signal: listOptions.signal,
			include: {
				content: true,
			},
		});

		const resolvedGames = objects.map((object) => {
			try {
				return this.#resolvePvPCoinflipGameObject(object);
			} catch (error) {
				return error instanceof Error ? error : new Error(String(error));
			}
		});

		if (throwOnError) {
			const firstError = resolvedGames.find((game) => game instanceof Error);
			if (firstError) {
				throw firstError;
			}
		}

		return resolvedGames.flatMap((game) =>
			game instanceof Error ? [] : [game],
		);
	}

	/**
	 * Fetches a PvP coinflip game object from chain and parses it into the SDK's
	 * normalized runtime shape.
	 *
	 * This resolves the raw object through the configured client, requires the
	 * object's `content` to be present, decodes that content with the generated
	 * `PvPCoinflipGame` BCS parser, and normalizes the generic coin type into a
	 * standard struct tag string. Use this when a product needs the current state
	 * of a specific PvP coinflip match before rendering join, cancel, or result UI.
	 *
	 * @param gameId On-chain object id of the PvP coinflip game.
	 * @returns Parsed PvP coinflip game state with a normalized `coinType`.
	 * @throws Error If the object cannot be decoded because no content was returned.
	 */
	async resolvePvPConflipGame(
		gameId: string,
		options: Omit<SuiClientTypes.GetObjectOptions, 'objectId' | 'include'> = {},
	) {
		const { object } = await this.#client.core.getObject({
			...options,
			objectId: gameId,
			include: { content: true },
		});

		return this.#resolvePvPCoinflipGameObject(object);
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
		PvPCoinflipGame,
		// Events
		/**
		 * Event emitted at the end of a standard game (e.g., Coinflip, Limbo), containing the result and payout information.
		 */
		BetResultEvent,
		/**
		 * Event emitted when a PvP Coinflip game is created, containing the game configuration and initial state.
		 */
		PvPCoinflipGameCreatedEvent,
		/**
		 * Event emitted when a PvP Coinflip game is resolved, containing the final outcome.
		 */
		PvPCoinflipGameResolvedEvent,
		/**
		 * Event emitted when a PvP Coinflip game is cancelled.
		 */
		PvPCoinflipGameCancelledEvent,
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

	#resolvePvPCoinflipGameObject(
		object: SuiClientTypes.Object<{ content: true }> | Error,
	) {
		if (object instanceof Error) {
			throw object;
		}

		if (!object.content) {
			throw new Error(
				'Unable to resolve PvP coinflip game from retrieved object',
			);
		}

		return {
			...PvPCoinflipGame.parse(object.content),
			coinType: normalizeStructTag(parseStructTag(object.type).typeParams[0]),
		};
	}
}
