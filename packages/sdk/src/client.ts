// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { InferBcsType } from '@mysten/bcs';
import type { ClientCache, ClientWithCoreApi, SuiClientTypes } from '@mysten/sui/client';
import { BuildTransactionOptions, Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, toBase64 } from '@mysten/sui/utils';
import { CoinStruct } from './bcs/index.js';
import { BetResultEvent } from './contracts/core/core.js';
import { Nft as NftV1, Factory as NftV1Factory } from './contracts/nft-v1/nft.js';
import {
	Game as PvPCoinflipGame,
	GameCancelledEvent as PvPCoinflipGameCancelledEvent,
	GameCreatedEvent as PvPCoinflipGameCreatedEvent,
	GameResolvedEvent as PvPCoinflipGameResolvedEvent,
	PvpCoinflipRegistryKey,
} from './contracts/pvp-coinflip/pvp_coinflip.js';
import {
	ReferrerClaimCommissionBalanceEvent,
	ReferrerClaimLevelUpUsdRewardsEvent,
} from './contracts/referral/referral.js';
import { TypeName } from './contracts/stdlib/type_name.js';
import {
	DEFAULT_CACHE_TTL_MS,
	getTtlCacheKey,
	normalizeGameParameterValues,
	resolveSuigarConfig,
} from './helpers/index.js';
import {
	buildClaimReferralCommissionTransaction,
	buildClaimReferralLevelUpUsdRewardsTransaction,
	buildCoinflipTransaction,
	buildLimboTransaction,
	buildMintNftV1Transaction,
	buildPlinkoTransaction,
	buildPvPCoinflipTransaction,
	buildRangeTransaction,
	buildSoccerTransaction,
	buildWheelTransaction,
} from './transactions/index.js';
import { GAME_SETTINGS } from './types/game-settings.type.js';
import type {
	ClaimReferralCommissionOptions,
	ClaimReferralLevelUpUsdRewardsOptions,
	CreateGameBetOptions,
	Game,
	GameParameters,
	GetGameParametersOptions,
	MintNftV1Options,
	OnChainGameParameters,
	PvPCoinflipGameOptions,
	SuigarConfig,
	SuigarExtensionOptions,
	SuigarNetwork,
	WithThrowOnError,
} from './types/index.js';
import { SUPPORTED_SUI_NETWORKS } from './types/network.type.js';
import { DEFAULT_QUERY_LIMIT, parseCoinType } from './utils/index.js';

export function suigar<const Name = 'suigar'>({
	name = 'suigar' as Name,
	config,
	partner,
	cacheTtl,
}: SuigarExtensionOptions<Name> = {}) {
	return {
		name,
		register: (client: ClientWithCoreApi): SuigarClient => {
			return new SuigarClient({
				client,
				name: String(name),
				config,
				partner,
				cacheTtl,
			});
		},
	};
}

export class SuigarClient {
	#client: ClientWithCoreApi;

	#config: SuigarConfig;

	#partner: string | undefined;

	#cache: ClientCache;
	#cacheTtl: number;

	constructor({
		client,
		name,
		config,
		partner,
		cacheTtl,
	}: Omit<SuigarExtensionOptions, 'name'> & {
		client: ClientWithCoreApi;
		name: string;
	}) {
		const network = client.network as SuigarNetwork;
		if (!SUPPORTED_SUI_NETWORKS.includes(network)) {
			throw new RangeError(`Unsupported network: ${network}`);
		}

		this.#client = client;
		this.#partner = partner;
		this.#cache = client.cache.scope(`@suigar/sdk:${name}`);
		this.#cacheTtl = cacheTtl ? (cacheTtl <= 0 ? 0 : cacheTtl) : DEFAULT_CACHE_TTL_MS;

		this.#config = resolveSuigarConfig({ network, config });
	}

	/**
	 * Returns the resolved SDK configuration for the connected network.
	 *
	 * This is primarily useful for debugging or inspecting which package ids,
	 * object ids, supported coin metadata, and price info object ids the SDK
	 * resolved for the current client network.
	 *
	 * @returns Network-resolved Suigar configuration.
	 */
	getConfig(): SuigarConfig {
		return this.#config;
	}

	/**
	 * Builds a transaction with the configured Sui client and encodes the resulting BCS bytes as base64.
	 *
	 * Use this when an external wallet, API, or transport expects the built transaction payload as a base64 string
	 * instead of raw bytes. The SDK always injects the configured Sui client, so `options` accepts the standard
	 * transaction build options except for `client`.
	 *
	 * @param options Transaction to build and optional build options forwarded to `transaction.build()`, excluding `client`.
	 * @returns Base64-encoded transaction bytes ready to send over the wire.
	 */
	async serializeTransactionToBase64({
		transaction,
		...options
	}: Omit<BuildTransactionOptions, 'client'> & {
		transaction: Transaction;
	}): Promise<string> {
		const bytes = await transaction.build({ ...options, client: this.#client });
		return toBase64(bytes);
	}

	/**
	 * Reads on-chain game parameters for the requested game.
	 *
	 * The SDK first reads the selected game's settings object from SweetHouse,
	 * then reads that game's coin-specific `Parameters<T>` object. Results are
	 * cached according to the extension `cacheTtl` option. Pass
	 * `ignoreCache: true` to refresh the on-chain read and replace the cached
	 * value. Generated Move float fields are decoded into JavaScript numbers,
	 * including floats nested in game configs.
	 *
	 * @param options Game id, required coin type, plus optional cache override and abort signal.
	 * @returns Parsed game parameters typed for the requested game.
	 */
	async getGameParameters<TGame extends Game>({
		game,
		...options
	}: GetGameParametersOptions<TGame>): Promise<GameParameters<TGame>> {
		const { sweetHouse: sweetHouseObjectId } = this.#config.objectIds;
		const gameDefinition = GAME_SETTINGS[game];
		const gameSettingsKeyType = gameDefinition.settingsKey.typeTag({
			package: this.#config.packageIds[gameDefinition.packageId],
		});
		const coinType = normalizeStructTag(options.coinType);

		const cacheKey: [string, ...Array<string>] = [
			'getGameParameters',
			sweetHouseObjectId,
			gameSettingsKeyType,
			coinType,
		];
		const load = async () => {
			const { signal } = options;

			const {
				object: { objectId },
			} = await this.#client.core.getDynamicObjectField({
				parentId: sweetHouseObjectId,
				name: {
					type: gameSettingsKeyType,
					bcs: gameDefinition.settingsKey.serialize({ dummy_field: false }).toBytes(),
				},
				signal,
			});

			const { object } = await this.#client.core.getDynamicObjectField({
				parentId: objectId,
				name: {
					type: TypeName.name,
					bcs: TypeName.serialize({
						name: coinType.replace(/^0x/u, ''),
					}).toBytes(),
				},
				include: { content: true },
				signal,
			});

			if (!object?.content) {
				throw new Error(`Missing parameters object content for ${game} and coin type ${coinType}`);
			}

			return normalizeGameParameterValues(
				gameDefinition.parameters.parse(object.content) as OnChainGameParameters<TGame>,
			);
		};

		if (options.ignoreCache) {
			this.#cache.clear(cacheKey);
		}

		if (this.#cacheTtl <= 0) {
			return load() as Promise<GameParameters<TGame>>;
		}

		return this.#cache.read([...cacheKey, getTtlCacheKey(this.#cacheTtl)], load) as Promise<
			GameParameters<TGame>
		>;
	}

	async #getPvPCoinflipRegistryId(signal?: AbortSignal): Promise<string> {
		const { sweetHouse: sweetHouseObjectId } = this.#config.objectIds;
		const pvpCoinflipRegistryKeyType = PvpCoinflipRegistryKey.typeTag({
			package: this.#config.packageIds.pvpCoinflip,
		});

		return this.#cache.read(
			['getPvPCoinflipRegistryId', sweetHouseObjectId, pvpCoinflipRegistryKeyType],
			async () => {
				const { object } = await this.#client.core.getDynamicObjectField({
					parentId: sweetHouseObjectId,
					name: {
						type: pvpCoinflipRegistryKeyType,
						bcs: PvpCoinflipRegistryKey.serialize({ dummy_field: false }).toBytes(),
					},
					signal,
				});

				return object.objectId;
			},
		);
	}

	/**
	 * Lists unresolved PvP coinflip games from the resolved registry and resolves
	 * each entry into parsed on-chain game state.
	 *
	 * This fetches dynamic fields from the PvP coinflip registry object, then bulk
	 * loads the referenced game objects through `client.core.getObjects()`. Registry
	 * membership is the unresolved-state signal: when a game is joined and resolved,
	 * the Move flow removes it from the registry and deletes the live `Game` object.
	 * Use this when a product needs the current set of open PvP coinflip matches for
	 * browsing or lobby views.
	 *
	 * @param options Optional dynamic field pagination forwarded to `listDynamicFields()`, excluding `parentId`.
	 * Supported options such as `limit`, `cursor`, and `signal` are forwarded to the
	 * underlying lookup calls. Pass `throwOnError: true` to fail the whole lookup
	 * when any referenced game object cannot be fetched or parsed. By default,
	 * failed per-object lookups are skipped and only successfully parsed unresolved
	 * games are returned.
	 * @returns Parsed unresolved PvP coinflip game objects for the requested
	 * registry page. When `throwOnError` is `false`, entries that fail object fetch
	 * or parse are omitted from the returned array.
	 */
	async getPvPCoinflipGames(
		options: WithThrowOnError<Omit<SuiClientTypes.ListDynamicFieldsOptions, 'parentId'>> = {
			limit: DEFAULT_QUERY_LIMIT,
		},
	): Promise<Array<InferBcsType<typeof PvPCoinflipGame> & { coin_type: string }>> {
		const { throwOnError = false, ...listOptions } = options;
		const { dynamicFields } = await this.#client.core.listDynamicFields({
			...listOptions,
			parentId: await this.#getPvPCoinflipRegistryId(listOptions.signal),
		});

		const { objects } = await this.#client.core.getObjects({
			objectIds: dynamicFields.map(({ childId }) => childId!),
			signal: listOptions.signal,
			include: {
				content: true,
			},
		});

		const resolvedGames = objects.map((object) => {
			try {
				if (object instanceof Error) {
					throw object;
				}

				if (!object.content) {
					throw new Error('Unable to resolve PvP coinflip game from retrieved object');
				}

				return {
					...PvPCoinflipGame.parse(object.content),
					coin_type: parseCoinType(object.type),
				} satisfies Awaited<ReturnType<SuigarClient['getPvPCoinflipGames']>>[number];
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

		return resolvedGames.flatMap((game) => (game instanceof Error ? [] : [game]));
	}

	async #getSimulatedCommandReturnValue({
		transaction,
		commandIndex = 0,
		returnValueIndex = 0,
	}: {
		transaction: Transaction;
		commandIndex?: number;
		returnValueIndex?: number;
	}): Promise<SuiClientTypes.CommandOutput['bcs']> {
		const result = await this.#client.core.simulateTransaction({
			transaction,
			include: { commandResults: true },
		});

		if (result.$kind === 'FailedTransaction') {
			throw new Error('Transaction simulation failed.');
		}

		const returnValue =
			result.commandResults?.[commandIndex]?.returnValues?.[returnValueIndex]?.bcs;
		if (!returnValue) {
			throw new Error(
				`Transaction simulation did not return a value at command ${commandIndex}, return value ${returnValueIndex}.`,
			);
		}

		return returnValue;
	}

	/**
	 * Transaction builders for Suigar games and referrals.
	 */
	tx = {
		/**
		 * Creates a standard game transaction for the provided game.
		 *
		 * @param options Supported standard game with transaction builder options.
		 * @returns Prepared transaction for the selected game.
		 */
		createGameBet: (options: CreateGameBetOptions): Transaction => {
			switch (options.game) {
				case 'coinflip':
					return buildCoinflipTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					});
				case 'limbo':
					return buildLimboTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					});
				case 'plinko':
					return buildPlinkoTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					});
				case 'range':
					return buildRangeTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					});
				case 'soccer':
					return buildSoccerTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					});
				case 'wheel':
					return buildWheelTransaction({
						...options,
						config: this.#config,
						partner: this.#partner,
					});
				default:
					throw new RangeError(`Unsupported game: ${(options as { game?: string })?.game}`);
			}
		},
		/** PvP coinflip transaction builders, grouped by game action. */
		pvpCoinflip: {
			createGame: (options: PvPCoinflipGameOptions<'create'>): Transaction => {
				return buildPvPCoinflipTransaction({
					...options,
					action: 'create',
					config: this.#config,
					partner: this.#partner,
				});
			},
			joinGame: (options: PvPCoinflipGameOptions<'join'>): Transaction => {
				return buildPvPCoinflipTransaction({
					...options,
					action: 'join',
					client: this.#client,
					config: this.#config,
					partner: this.#partner,
				});
			},
			cancelGame: (options: PvPCoinflipGameOptions<'cancel'>): Transaction => {
				return buildPvPCoinflipTransaction({
					...options,
					action: 'cancel',
					config: this.#config,
					partner: this.#partner,
				});
			},
		},
		/** Referral transaction builders. Each transaction returns its claimed coin to `owner`. */
		referral: {
			claimCommission: (options: ClaimReferralCommissionOptions): Transaction => {
				return buildClaimReferralCommissionTransaction({
					...options,
					config: this.#config,
				});
			},
			claimLevelUpUsdRewards: (options: ClaimReferralLevelUpUsdRewardsOptions): Transaction => {
				return buildClaimReferralLevelUpUsdRewardsTransaction({
					...options,
					config: this.#config,
				});
			},
		},
		nftV1: {
			mint: (options: MintNftV1Options): Transaction => {
				return buildMintNftV1Transaction({
					...options,
					client: this.#client,
					config: this.#config,
				});
			},
		},
	};

	/** Read-only referral claim amounts produced by simulating the real claim transaction. */
	view = {
		referral: {
			getCommission: async ({
				owner,
				coinType,
			}: Omit<ClaimReferralCommissionOptions, 'gasBudget'>) => {
				try {
					const claimCoinBcs = await this.#getSimulatedCommandReturnValue({
						transaction: this.tx.referral.claimCommission({
							owner,
							coinType,
						}),
					});
					return BigInt(CoinStruct.parse(claimCoinBcs).balance);
				} catch {
					return 0n;
				}
			},
			getLevelUpUsdRewards: async ({
				owner,
			}: Omit<ClaimReferralLevelUpUsdRewardsOptions, 'gasBudget'>) => {
				try {
					const claimCoinBcs = await this.#getSimulatedCommandReturnValue({
						transaction: this.tx.referral.claimLevelUpUsdRewards({
							owner,
						}),
					});
					return BigInt(CoinStruct.parse(claimCoinBcs).balance);
				} catch {
					return 0n;
				}
			},
		},
	};

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
		 * Shared factory containing Suigar NFT V1 specifications.
		 */
		NftV1Factory,
		/**
		 * Minted Suigar NFT V1 owned directly by an address.
		 */
		NftV1,
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
		/** Event emitted when a referrer claims commission for a wager coin. */
		ReferrerClaimCommissionBalanceEvent,
		/** Event emitted when a referrer claims a USD-denominated level-up reward. */
		ReferrerClaimLevelUpUsdRewardsEvent,
	};
}
