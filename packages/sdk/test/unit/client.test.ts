// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import { CoreClient, type SuiClientTypes } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import {
	deriveDynamicFieldID,
	normalizeStructTag,
	normalizeSuiAddress,
	SUI_ADDRESS_LENGTH,
} from '@mysten/sui/utils';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import { suigar, type SuigarClient } from '../../src/client.js';
import { COINS, OBJECT_IDS } from '../../src/configs/index.js';
import {
	CoinFlipSettingsKey,
	Parameters as GeneratedCoinflipParameters,
} from '../../src/contracts/coinflip/coinflip.js';
import {
	Parameters as GeneratedLimboParameters,
	LimboSettingsKey,
} from '../../src/contracts/limbo/limbo.js';
import {
	Game as GeneratedPvPCoinflipGame,
	PvpCoinflipRegistryKey,
} from '../../src/contracts/pvp-coinflip/pvp_coinflip.js';
import { TypeName } from '../../src/contracts/stdlib/type_name.js';
import type { SuigarConfigOverrides } from '../../src/types/index.js';
import { createContractCallMock, getFirstMockArg, TEST_CONFIG } from '../utils.js';

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

function serializeDummyFieldKey(
	key: typeof CoinFlipSettingsKey | typeof LimboSettingsKey | typeof PvpCoinflipRegistryKey,
): Uint8Array {
	return key.serialize({ dummy_field: false }).toBytes();
}

const COINFLIP_SETTINGS_FIELD_BCS = serializeDummyFieldKey(CoinFlipSettingsKey);
const LIMBO_SETTINGS_FIELD_BCS = serializeDummyFieldKey(LimboSettingsKey);
const PVP_COINFLIP_REGISTRY_FIELD_BCS = serializeDummyFieldKey(PvpCoinflipRegistryKey);
const SUI_TYPE_NAME_FIELD_BCS = TypeName.serialize({
	name: normalizeStructTag(COINS.testnet.sui.coinType).replace(/^0x/u, ''),
}).toBytes();

const TEST_MVR_PACKAGES: Record<string, string> = {
	'@suigar/core': TEST_CONFIG.packageIds.core,
	'@suigar/referral': TEST_CONFIG.packageIds.referral,
	'@suigar/coinflip': TEST_CONFIG.packageIds.coinflip,
	'@suigar/limbo': TEST_CONFIG.packageIds.limbo,
	'@suigar/plinko': TEST_CONFIG.packageIds.plinko,
	'@suigar/pvp-coinflip': TEST_CONFIG.packageIds.pvpCoinflip,
	'@suigar/range': TEST_CONFIG.packageIds.range,
	'@suigar/soccer': TEST_CONFIG.packageIds.soccer,
	'@suigar/wheel': TEST_CONFIG.packageIds.wheel,
};

function resolveTestMvrType(type: string): string {
	return normalizeStructTag(
		Object.entries(TEST_MVR_PACKAGES).reduce(
			(result, [name, address]) => result.replaceAll(name, address),
			type,
		),
	);
}

function createDynamicField(childId: string): SuiClientTypes.DynamicFieldEntry {
	return {
		fieldId: `${childId}-field`,
		name: {
			type: 'address',
			bcs: new Uint8Array(),
		},
		type: 'DynamicObject',
		valueType: '0x2::object::ID',
		$kind: 'DynamicObject',
		childId,
	};
}

function createTypeNameDynamicField(
	childId: string,
	coinType = normalizeStructTag('0x2::sui::SUI'),
): SuiClientTypes.DynamicFieldEntry {
	return {
		fieldId: `${childId}-field`,
		name: {
			type: normalizeStructTag('0x1::type_name::TypeName'),
			bcs: TypeName.serialize({ name: coinType }).toBytes(),
		},
		type: 'DynamicObject',
		valueType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::Parameters<${coinType}>`,
		$kind: 'DynamicObject',
		childId,
	};
}

function createPvPCoinflipGameObject(gameId: string): SuiClientTypes.Object<{ content: true }> {
	return {
		objectId: gameId,
		version: '1',
		digest: `${gameId}-digest`,
		owner: {
			$kind: 'AddressOwner',
			AddressOwner: '0xowner',
		},
		type: `${TEST_CONFIG.packageIds.pvpCoinflip}::pvp_coinflip::Game<0x2::sui::SUI>`,
		content: new Uint8Array([1]),
		previousTransaction: undefined,
		objectBcs: undefined,
		json: undefined,
		display: undefined,
	};
}

function createCoinflipParametersObject({
	objectId,
	minStake,
}: {
	objectId: string;
	minStake: number | bigint;
}): SuiClientTypes.Object<{ content: true }> {
	return {
		objectId,
		version: '1',
		digest: `${objectId}-digest`,
		owner: {
			$kind: 'AddressOwner',
			AddressOwner: '0xowner',
		},
		type: `${TEST_CONFIG.packageIds.coinflip}::coinflip::Parameters<0x2::sui::SUI>`,
		content: GeneratedCoinflipParameters.serialize({
			id: objectId,
			house_edge: 100n,
			min_stake: BigInt(minStake),
			max_stake: 10_000n,
		}).toBytes(),
		previousTransaction: undefined,
		objectBcs: undefined,
		json: undefined,
		display: undefined,
	};
}

function createLimboParametersObject(objectId: string): SuiClientTypes.Object<{ content: true }> {
	return {
		objectId,
		version: '1',
		digest: `${objectId}-digest`,
		owner: {
			$kind: 'AddressOwner',
			AddressOwner: '0xowner',
		},
		type: `${TEST_CONFIG.packageIds.limbo}::limbo::Parameters<0x2::sui::SUI>`,
		content: GeneratedLimboParameters.serialize({
			id: objectId,
			min_stake: 25n,
			max_stake: 10_000n,
			max_payout: 100_000n,
			min_target_multiplier: {
				mant: 1n,
				exp: { bits: 52n },
				is_negative: false,
			},
			max_target_multiplier: {
				mant: 2n,
				exp: { bits: 52n },
				is_negative: false,
			},
			max_number_of_games: 10n,
			min_rtp: { mant: 95n, exp: { bits: 52n }, is_negative: false },
			max_rtp: { mant: 99n, exp: { bits: 52n }, is_negative: false },
		}).toBytes(),
		previousTransaction: undefined,
		objectBcs: undefined,
		json: undefined,
		display: undefined,
	};
}

function createObjectWithoutContent(objectId: string): SuiClientTypes.Object {
	return {
		objectId,
		version: '1',
		digest: `${objectId}-digest`,
		owner: {
			$kind: 'AddressOwner',
			AddressOwner: '0xowner',
		},
		type: `${TEST_CONFIG.packageIds.coinflip}::coinflip::Parameters<0x2::sui::SUI>`,
		content: undefined,
		previousTransaction: undefined,
		objectBcs: undefined,
		json: undefined,
		display: undefined,
	};
}

function createDynamicObjectFieldObject({
	childId,
	fieldId,
	nameBcs,
	nameType,
}: {
	childId: string;
	fieldId: string;
	nameBcs: Uint8Array;
	nameType: string;
}): SuiClientTypes.Object<{ content: true }> {
	const content = new Uint8Array(SUI_ADDRESS_LENGTH + nameBcs.length + SUI_ADDRESS_LENGTH);
	content.set(bcs.Address.serialize(normalizeSuiAddress(fieldId)).toBytes());
	content.set(nameBcs, SUI_ADDRESS_LENGTH);
	content.set(
		bcs.Address.serialize(normalizeSuiAddress(childId)).toBytes(),
		SUI_ADDRESS_LENGTH + nameBcs.length,
	);

	return {
		objectId: fieldId,
		version: '1',
		digest: `${fieldId}-digest`,
		owner: {
			$kind: 'AddressOwner',
			AddressOwner: '0xowner',
		},
		type: `0x2::dynamic_object_field::Field<${nameType}, 0x2::object::ID>`,
		content,
		previousTransaction: undefined,
		objectBcs: undefined,
		json: undefined,
		display: undefined,
	};
}

function createPvPCoinflipGameObjectWithoutContent(gameId: string): SuiClientTypes.Object {
	return {
		objectId: gameId,
		version: '1',
		digest: `${gameId}-digest`,
		owner: {
			$kind: 'AddressOwner',
			AddressOwner: '0xowner',
		},
		type: `${TEST_CONFIG.packageIds.pvpCoinflip}::pvp_coinflip::Game<0x2::sui::SUI>`,
		content: undefined,
		previousTransaction: undefined,
		objectBcs: undefined,
		json: undefined,
		display: undefined,
	};
}

type ParsedPvPCoinflipGame = ReturnType<typeof GeneratedPvPCoinflipGame.parse>;

function createParsedPvPCoinflipGame(gameId: string): ParsedPvPCoinflipGame {
	return {
		id: gameId,
		creator: '0xcreator',
		creator_is_tails: false,
		is_private: false,
		creator_metadata: { contents: [] },
		joiner: '0xjoiner',
		winner: '0xwinner',
		stake_per_player: '1',
		house_edge_bps: '100',
		stake_pot: { value: '2' },
	} as ParsedPvPCoinflipGame;
}

type SuigarTestClient = TestClient & { suigar: SuigarClient };

class TestClient extends CoreClient {
	mockObjects: Array<Error | SuiClientTypes.Object | SuiClientTypes.Object<{ content: true }>> = [];

	mockDynamicFields: Array<SuiClientTypes.DynamicFieldEntry> = [];

	mockDynamicFieldLookups: Array<{
		childId: string;
		nameBcs?: Uint8Array;
		nameType: string;
		parentId: string;
	}> = [];

	getDynamicObjectFieldCalls: Array<SuiClientTypes.GetDynamicObjectFieldOptions> = [];

	listDynamicFieldsCalls: Array<SuiClientTypes.ListDynamicFieldsOptions> = [];

	getObjectsCalls: Array<SuiClientTypes.GetObjectsOptions> = [];

	simulateTransactionCalls: Array<unknown> = [];

	mockSimulationResult: unknown;

	dynamicFieldObjectReads = 0;

	constructor() {
		super({ network: 'testnet', base: undefined as never });
	}

	mvr: SuiClientTypes.MvrMethods = {
		resolvePackage: async ({ package: packageName }) => ({
			package: TEST_MVR_PACKAGES[packageName] ?? packageName,
		}),
		resolveType: async ({ type }) => ({
			type: resolveTestMvrType(type),
		}),
		resolve: async ({ packages = [], types = [] }) => ({
			packages: Object.fromEntries(
				packages.map((packageName) => [
					packageName,
					{ package: TEST_MVR_PACKAGES[packageName] ?? packageName },
				]),
			),
			types: Object.fromEntries(types.map((type) => [type, { type: resolveTestMvrType(type) }])),
		}),
	};

	getObjects: CoreClient['getObjects'] = async <Include extends SuiClientTypes.ObjectInclude>(
		options: SuiClientTypes.GetObjectsOptions<Include>,
	) => {
		this.getObjectsCalls.push(options);
		return {
			objects: options.objectIds.map((objectId, index) => {
				const object = this.mockObjects.find((object) => {
					return (
						!(object instanceof Error) &&
						normalizeSuiAddress(object.objectId) === normalizeSuiAddress(objectId)
					);
				});
				if (object) {
					return object;
				}

				const dynamicFieldLookup =
					this.mockDynamicFieldLookups.find((lookup) => {
						if (!lookup.nameBcs) {
							return false;
						}

						return [lookup.parentId, normalizeSuiAddress(lookup.parentId)].some(
							(parentId) =>
								deriveDynamicFieldID(parentId, lookup.nameType, lookup.nameBcs!) === objectId,
						);
					}) ??
					(() => {
						const lookups = this.mockDynamicFieldLookups.filter((lookup) => lookup.nameBcs);
						return lookups[this.dynamicFieldObjectReads++ % lookups.length];
					})();
				if (dynamicFieldLookup?.nameBcs) {
					return createDynamicObjectFieldObject({
						childId: dynamicFieldLookup.childId,
						fieldId: objectId,
						nameBcs: dynamicFieldLookup.nameBcs,
						nameType: dynamicFieldLookup.nameType,
					});
				}

				return this.mockObjects[index] ?? new Error(`No object found for id ${objectId}`);
			}) as SuiClientTypes.GetObjectsResponse<Include>['objects'],
		};
	};

	listCoins: CoreClient['listCoins'] = async () => ({
		objects: [],
		hasNextPage: false,
		cursor: null,
	});

	listOwnedObjects: CoreClient['listOwnedObjects'] = async <
		Include extends SuiClientTypes.ObjectInclude,
	>() => ({
		objects: [] as Array<SuiClientTypes.Object<Include>>,
		hasNextPage: false,
		cursor: null,
	});

	getBalance: CoreClient['getBalance'] = async () => ({
		balance: {
			coinType: '0x2::sui::SUI',
			balance: '0',
			coinBalance: '0',
			addressBalance: '0',
		},
	});

	listBalances: CoreClient['listBalances'] = async () => ({
		balances: [],
		hasNextPage: false,
		cursor: null,
	});

	getCoinMetadata: CoreClient['getCoinMetadata'] = async () => ({
		coinMetadata: null,
	});

	getTransaction: CoreClient['getTransaction'] = async () => {
		throw new Error('Not implemented.');
	};

	executeTransaction: CoreClient['executeTransaction'] = async () => {
		throw new Error('Not implemented.');
	};

	simulateTransaction: CoreClient['simulateTransaction'] = async (options) => {
		this.simulateTransactionCalls.push(options);
		return this.mockSimulationResult as never;
	};

	getReferenceGasPrice: CoreClient['getReferenceGasPrice'] = async () => ({
		referenceGasPrice: '0',
		price: '1',
	});

	getCurrentSystemState: CoreClient['getCurrentSystemState'] = async () =>
		({
			systemState: {
				systemStateVersion: '1',
				epoch: '1',
				protocolVersion: '1',
				referenceGasPrice: '1',
				epochStartTimestampMs: '0',
				safeMode: false,
				safeModeStorageRewards: '0',
				safeModeComputationRewards: '0',
				safeModeStorageRebates: '0',
				safeModeNonRefundableStorageFee: '0',
				parameters: {
					epochDurationMs: '0',
					stakeSubsidyStartEpoch: '0',
					maxValidatorCount: '0',
					minValidatorJoiningStake: '0',
					validatorLowStakeThreshold: '0',
					validatorLowStakeGracePeriod: '0',
				},
				storageFund: {
					totalObjectStorageRebates: '0',
					nonRefundableBalance: '0',
				},
				stakeSubsidy: {
					balance: '0',
					distributionCounter: '0',
					currentDistributionAmount: '0',
					stakeSubsidyPeriodLength: '0',
					stakeSubsidyDecreaseRate: 0,
				},
			},
		}) satisfies SuiClientTypes.GetCurrentSystemStateResponse;

	getProtocolConfig: CoreClient['getProtocolConfig'] = async () =>
		({ protocolConfig: {} }) as SuiClientTypes.GetProtocolConfigResponse;

	getChainIdentifier: CoreClient['getChainIdentifier'] = async () =>
		({
			chainIdentifier: 'testnet',
		}) satisfies SuiClientTypes.GetChainIdentifierResponse;

	listDynamicFields: CoreClient['listDynamicFields'] = async (options) => {
		this.listDynamicFieldsCalls.push(options);
		return {
			dynamicFields: this.mockDynamicFields,
			hasNextPage: false,
			cursor: null,
		};
	};

	getDynamicObjectField: CoreClient['getDynamicObjectField'] = async <
		Include extends SuiClientTypes.ObjectInclude,
	>(
		options: SuiClientTypes.GetDynamicObjectFieldOptions<Include>,
	) => {
		const resolvedOptions = {
			...options,
			name: {
				...options.name,
				type: resolveTestMvrType(options.name.type),
			},
		};
		this.getDynamicObjectFieldCalls.push(resolvedOptions);
		const lookup = this.mockDynamicFieldLookups.find((entry) => {
			const nameTypes = [
				entry.nameType,
				`0x2::dynamic_object_field::Wrapper<${entry.nameType}>`,
			].map((type) => normalizeStructTag(type));
			return (
				entry.parentId === resolvedOptions.parentId && nameTypes.includes(resolvedOptions.name.type)
			);
		});

		if (!lookup) {
			throw new Error(`No dynamic object field found for ${resolvedOptions.name.type}`);
		}

		const object =
			this.mockObjects.find((entry) => {
				return !(entry instanceof Error) && entry.objectId === lookup.childId;
			}) ??
			({
				objectId: lookup.childId,
				version: '1',
				digest: `${lookup.childId}-digest`,
				owner: {
					$kind: 'AddressOwner',
					AddressOwner: '0xowner',
				},
				type: resolvedOptions.name.type,
				previousTransaction: undefined,
				objectBcs: undefined,
				json: undefined,
				display: undefined,
			} as SuiClientTypes.Object<Include>);

		if (object instanceof Error) {
			throw object;
		}

		return {
			object: object as SuiClientTypes.GetDynamicObjectFieldResponse<Include>['object'],
		};
	};

	resolveTransactionPlugin: CoreClient['resolveTransactionPlugin'] = () => async () => {};

	verifyZkLoginSignature: CoreClient['verifyZkLoginSignature'] = async () =>
		({ success: true }) as SuiClientTypes.ZkLoginVerifyResponse;

	getMoveFunction: CoreClient['getMoveFunction'] = async () =>
		({ function: null }) as unknown as SuiClientTypes.GetMoveFunctionResponse;

	defaultNameServiceName: CoreClient['defaultNameServiceName'] = async () =>
		({
			data: {
				name: null,
			},
		}) satisfies SuiClientTypes.DefaultNameServiceNameResponse;

	resolveNameServiceAddress: CoreClient['resolveNameServiceAddress'] = async () =>
		({
			address: null,
		}) satisfies SuiClientTypes.ResolveNameServiceAddressResponse;

	listTransactions: CoreClient['listTransactions'] = () => {
		throw new Error('Not implemented.');
	};

	listEvents: CoreClient['listEvents'] = () => {
		throw new Error('Not implemented.');
	};
}

function createSuigarTestClient({
	objects = [],
	dynamicFields = [],
	dynamicFieldLookups = [],
	partner,
	cacheTtl,
	config,
}: {
	objects?: SuigarTestClient['mockObjects'];
	dynamicFields?: Array<SuiClientTypes.DynamicFieldEntry>;
	dynamicFieldLookups?: TestClient['mockDynamicFieldLookups'];
	partner?: string;
	cacheTtl?: number;
	config?: SuigarConfigOverrides;
} = {}): SuigarTestClient {
	const client = new TestClient();
	const pvpCoinflipPackageId =
		config?.packageIds?.pvpCoinflip ?? TEST_CONFIG.packageIds.pvpCoinflip;
	client.mockObjects = objects;
	client.mockDynamicFields = dynamicFields;
	client.mockDynamicFieldLookups = [
		{
			childId: TEST_CONFIG.registryIds.pvpCoinflip,
			parentId: OBJECT_IDS.testnet.sweetHouse,
			nameType: `${pvpCoinflipPackageId}::pvp_coinflip::PvpCoinflipRegistryKey`,
		},
		...dynamicFieldLookups,
	];

	return client.$extend(suigar({ partner, cacheTtl, config }));
}

describe('SuigarClient', () => {
	it('creates an extension-compatible client surface', () => {
		const client = createSuigarTestClient();

		expect(client.suigar).toBeDefined();
		expect(typeof client.suigar.serializeTransactionToBase64).toBe('function');
	});

	it('gets referral claim amounts by simulating the complete claim transaction', async () => {
		const client = createSuigarTestClient();
		const claimCoinBcs = bcs
			.struct('Coin', {
				id: bcs.Address,
				balance: bcs.u64(),
			})
			.serialize({ id: '0x1', balance: 123n })
			.toBytes();
		client.mockSimulationResult = {
			$kind: 'Transaction',
			Transaction: {},
			commandResults: [
				{
					returnValues: [{ bcs: claimCoinBcs }],
					mutatedReferences: [],
				},
			],
		};

		await expect(
			client.suigar.view.referral.getCommission({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
			}),
		).resolves.toBe(123n);
		await expect(
			client.suigar.view.referral.getLevelUpUsdRewards({
				owner: '0x123',
			}),
		).resolves.toBe(123n);

		expect(client.simulateTransactionCalls).toHaveLength(2);

		client.mockSimulationResult = {
			$kind: 'FailedTransaction',
			FailedTransaction: {},
			commandResults: undefined,
		};
		await expect(
			client.suigar.view.referral.getCommission({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
			}),
		).resolves.toBe(0n);
	});

	it('injects the configured partner into standard-game metadata', async () => {
		const playV2 = createContractCallMock();

		vi.resetModules();
		vi.doMock('../../src/contracts/coinflip/coinflip.js', async (importOriginal) => {
			const actual =
				await importOriginal<typeof import('../../src/contracts/coinflip/coinflip.js')>();
			return { ...actual, playV2 };
		});
		for (const contractPath of [
			'../../src/contracts/limbo/limbo.js',
			'../../src/contracts/plinko/plinko.js',
			'../../src/contracts/range/range.js',
			'../../src/contracts/wheel/wheel.js',
		]) {
			vi.doMock(contractPath, async (importOriginal) => await importOriginal());
		}
		await import('../../src/transactions/coinflip.js');
		vi.doMock(
			'../../src/contracts/pvp-coinflip/pvp_coinflip.js',
			async (importOriginal) => await importOriginal(),
		);
		const { suigar: mockedSuigar } = await import('../../src/client.js');
		const partner = normalizeSuiAddress('0x456');
		const client = new TestClient().$extend(mockedSuigar({ partner }));
		const coinType = client.suigar.getConfig().coins.sui.coinType;
		client.suigar.tx.createGameBet({
			game: 'coinflip',
			owner: '0x123',
			coinType,
			stake: 1000,
			side: 'heads',
		});

		const options = getFirstMockArg<{
			arguments: Array<unknown>;
		}>(playV2);
		expect(options.arguments[5]).toEqual(['partner']);
		expect(options.arguments[6]).toEqual([Array.from(Buffer.from(partner.slice(2), 'hex'))]);
	});

	it('exposes standard, PvP, and NFT transaction factories', () => {
		const client = createSuigarTestClient({
			objects: [
				{
					...createPvPCoinflipGameObject('0x456'),
					content: GeneratedPvPCoinflipGame.serialize({
						id: '0x456',
						creator: '0x1',
						creator_is_tails: false,
						is_private: false,
						creator_metadata: { contents: [] },
						joiner: '0x0',
						winner: '0x0',
						stake_per_player: '1',
						house_edge_bps: '100',
						stake_pot: { value: '2' },
					}).toBytes(),
				},
			],
		});
		const coinType = client.suigar.getConfig().coins.sui.coinType;

		expect(client.suigar.tx.createGameBet).toBeTypeOf('function');
		expect(client.suigar.tx.pvpCoinflip.createGame).toBeTypeOf('function');
		expect(client.suigar.tx.pvpCoinflip.joinGame).toBeTypeOf('function');
		expect(client.suigar.tx.pvpCoinflip.cancelGame).toBeTypeOf('function');
		expect(client.suigar.tx.nftV1.mint).toBeTypeOf('function');
		expect(
			client.suigar.tx.pvpCoinflip.createGame({
				owner: '0x123',
				coinType,
				stake: 1000,
				side: 'heads',
			}),
		).toBeInstanceOf(Transaction);
		expect(
			client.suigar.tx.pvpCoinflip.joinGame({
				owner: '0x123',
				coinType,
				gameId: '0x456',
			}),
		).toBeInstanceOf(Transaction);
		expect(
			client.suigar.tx.pvpCoinflip.cancelGame({
				owner: '0x123',
				coinType,
				gameId: '0x456',
			}),
		).toBeInstanceOf(Transaction);
	});

	it('loads typed game parameters through the SweetHouse settings object', async () => {
		const client = createSuigarTestClient({
			objects: [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })],
			dynamicFields: [
				createTypeNameDynamicField('0x111', normalizeStructTag(COINS.testnet.sui.coinType)),
			],
			dynamicFieldLookups: [
				{
					nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
					parentId: OBJECT_IDS.testnet.sweetHouse,
					nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
					childId: '0x222',
				},
				{
					nameBcs: SUI_TYPE_NAME_FIELD_BCS,
					parentId: '0x222',
					nameType: TypeName.name,
					childId: '0x111',
				},
			],
		});

		const parameters = await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(parameters.min_stake).toBe('25');
		expect(parameters.house_edge).toBe('100');
		expect(client.getDynamicObjectFieldCalls).toHaveLength(2);
		expect(client.getDynamicObjectFieldCalls[0]?.name).toEqual({
			type: normalizeStructTag(
				CoinFlipSettingsKey.typeTag({
					package: TEST_CONFIG.packageIds.coinflip,
				}),
			),
			bcs: COINFLIP_SETTINGS_FIELD_BCS,
		});
		expect(client.getDynamicObjectFieldCalls[1]?.name).toEqual({
			type: TypeName.name,
			bcs: SUI_TYPE_NAME_FIELD_BCS,
		});
		expect(TypeName.parse(client.getDynamicObjectFieldCalls[1]!.name.bcs).name).toBe(
			normalizeStructTag(COINS.testnet.sui.coinType).replace(/^0x/u, ''),
		);
		expect(client.listDynamicFieldsCalls).toHaveLength(0);
		expect(client.getObjectsCalls).toHaveLength(0);
	});

	it('loads game parameters with an overridden settings package key type', async () => {
		const coinflipPackageId = '0xcafe';
		const client = createSuigarTestClient({
			config: {
				packageIds: {
					coinflip: coinflipPackageId,
				},
			},
			objects: [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })],
			dynamicFieldLookups: [
				{
					nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
					parentId: OBJECT_IDS.testnet.sweetHouse,
					nameType: `${coinflipPackageId}::coinflip::CoinFlipSettingsKey`,
					childId: '0x222',
				},
				{
					nameBcs: SUI_TYPE_NAME_FIELD_BCS,
					parentId: '0x222',
					nameType: TypeName.name,
					childId: '0x111',
				},
			],
		});

		const parameters = await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(parameters.min_stake).toBe('25');
		expect(client.getDynamicObjectFieldCalls[0]?.name).toEqual({
			type: normalizeStructTag(
				CoinFlipSettingsKey.typeTag({
					package: coinflipPackageId,
				}),
			),
			bcs: COINFLIP_SETTINGS_FIELD_BCS,
		});
	});

	it('decodes generated Move floats in game parameters into numbers', async () => {
		const client = createSuigarTestClient({
			objects: [createLimboParametersObject('0x111')],
			dynamicFieldLookups: [
				{
					nameBcs: LIMBO_SETTINGS_FIELD_BCS,
					parentId: OBJECT_IDS.testnet.sweetHouse,
					nameType: `${TEST_CONFIG.packageIds.limbo}::limbo::LimboSettingsKey`,
					childId: '0x222',
				},
				{
					nameBcs: SUI_TYPE_NAME_FIELD_BCS,
					parentId: '0x222',
					nameType: TypeName.name,
					childId: '0x111',
				},
			],
		});

		const parameters = await client.suigar.getGameParameters({
			game: 'limbo',
			coinType: COINS.testnet.sui.coinType,
		});

		expectTypeOf(parameters.min_target_multiplier).toEqualTypeOf<number>();
		expectTypeOf(parameters.max_target_multiplier).toEqualTypeOf<number>();
		expect(parameters.min_target_multiplier).toBe(1);
		expect(parameters.max_target_multiplier).toBe(2);
		expect(parameters.min_rtp).toBe(95);
		expect(parameters.max_rtp).toBe(99);
	});

	it('throws the game and coin type when parameters content is missing', async () => {
		const client = createSuigarTestClient({
			objects: [createObjectWithoutContent('0x111')],
			dynamicFieldLookups: [
				{
					nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
					parentId: OBJECT_IDS.testnet.sweetHouse,
					nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
					childId: '0x222',
				},
				{
					nameBcs: SUI_TYPE_NAME_FIELD_BCS,
					parentId: '0x222',
					nameType: TypeName.name,
					childId: '0x111',
				},
			],
		});

		await expect(
			client.suigar.getGameParameters({
				game: 'coinflip',
				coinType: COINS.testnet.sui.coinType,
			}),
		).rejects.toThrow(
			`Missing parameters object content for coinflip and coin type ${normalizeStructTag(
				COINS.testnet.sui.coinType,
			)}`,
		);
	});

	it('caches settings ids and game parameters until ignored', async () => {
		const client = createSuigarTestClient({
			objects: [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })],
			dynamicFields: [
				createTypeNameDynamicField('0x111', normalizeStructTag(COINS.testnet.sui.coinType)),
			],
			dynamicFieldLookups: [
				{
					nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
					parentId: OBJECT_IDS.testnet.sweetHouse,
					nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
					childId: '0x222',
				},
				{
					nameBcs: SUI_TYPE_NAME_FIELD_BCS,
					parentId: '0x222',
					nameType: TypeName.name,
					childId: '0x111',
				},
			],
		});

		await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});
		await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(client.getDynamicObjectFieldCalls).toHaveLength(2);
		expect(client.listDynamicFieldsCalls).toHaveLength(0);
		expect(client.getObjectsCalls).toHaveLength(0);

		client.mockObjects = [createCoinflipParametersObject({ objectId: '0x333', minStake: 50n })];
		client.mockDynamicFieldLookups = client.mockDynamicFieldLookups.map((lookup) => {
			if (lookup.parentId === '0x222' && lookup.nameType === TypeName.name) {
				return { ...lookup, childId: '0x333' };
			}

			return lookup;
		});

		const refreshed = await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
			ignoreCache: true,
		});

		expect(refreshed.min_stake).toBe('50');
		expect(client.getDynamicObjectFieldCalls).toHaveLength(4);
		expect(client.listDynamicFieldsCalls).toHaveLength(0);
		expect(client.getObjectsCalls).toHaveLength(0);
	});

	it('resets the extension cache', async () => {
		const client = createSuigarTestClient({
			objects: [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })],
			dynamicFields: [
				createTypeNameDynamicField('0x111', normalizeStructTag(COINS.testnet.sui.coinType)),
			],
			dynamicFieldLookups: [
				{
					nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
					parentId: OBJECT_IDS.testnet.sweetHouse,
					nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
					childId: '0x222',
				},
				{
					nameBcs: SUI_TYPE_NAME_FIELD_BCS,
					parentId: '0x222',
					nameType: TypeName.name,
					childId: '0x111',
				},
			],
		});

		const first = await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		client.mockObjects = [createCoinflipParametersObject({ objectId: '0x111', minStake: 50n })];
		client.suigar.reset();

		const second = await client.suigar.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(first.min_stake).toBe('25');
		expect(second.min_stake).toBe('50');
		expect(client.getDynamicObjectFieldCalls).toHaveLength(4);
		expect(client.listDynamicFieldsCalls).toHaveLength(0);
		expect(client.getObjectsCalls).toHaveLength(0);
	});

	it.each([{ cacheTtl: 0 }, { cacheTtl: -1 }])(
		'does not cache game parameters when cacheTtl is $cacheTtl',
		async ({ cacheTtl }) => {
			const client = createSuigarTestClient({
				cacheTtl,
				objects: [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })],
				dynamicFields: [
					createTypeNameDynamicField('0x111', normalizeStructTag(COINS.testnet.sui.coinType)),
				],
				dynamicFieldLookups: [
					{
						nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
						parentId: OBJECT_IDS.testnet.sweetHouse,
						nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
						childId: '0x222',
					},
					{
						nameBcs: SUI_TYPE_NAME_FIELD_BCS,
						parentId: '0x222',
						nameType: TypeName.name,
						childId: '0x111',
					},
				],
			});

			const first = await client.suigar.getGameParameters({
				game: 'coinflip',
				coinType: COINS.testnet.sui.coinType,
			});

			client.mockObjects = [createCoinflipParametersObject({ objectId: '0x111', minStake: 50n })];

			const second = await client.suigar.getGameParameters({
				game: 'coinflip',
				coinType: COINS.testnet.sui.coinType,
			});

			expect(client.getDynamicObjectFieldCalls).toHaveLength(4);
			expect(first.min_stake).toBe('25');
			expect(second.min_stake).toBe('50');
			expect(client.listDynamicFieldsCalls).toHaveLength(0);
			expect(client.getObjectsCalls).toHaveLength(0);
		},
	);

	it('shares game parameter cache by extension name through the base Mysten client', async () => {
		const baseClient = new TestClient();
		baseClient.mockObjects = [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })];
		baseClient.mockDynamicFields = [
			createTypeNameDynamicField('0x111', normalizeStructTag(COINS.testnet.sui.coinType)),
		];
		baseClient.mockDynamicFieldLookups = [
			{
				nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
				parentId: OBJECT_IDS.testnet.sweetHouse,
				nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
				childId: '0x222',
			},
			{
				nameBcs: SUI_TYPE_NAME_FIELD_BCS,
				parentId: '0x222',
				nameType: TypeName.name,
				childId: '0x111',
			},
		];
		const first = baseClient.$extend(suigar({ name: 'shared' }));
		const second = baseClient.$extend(suigar({ name: 'shared' }));

		await first.shared.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});
		await second.shared.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(baseClient.getDynamicObjectFieldCalls).toHaveLength(2);
		expect(baseClient.listDynamicFieldsCalls).toHaveLength(0);
		expect(baseClient.getObjectsCalls).toHaveLength(0);
	});

	it('keeps game parameter cache entries separate across extension names', async () => {
		const baseClient = new TestClient();
		baseClient.mockObjects = [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })];
		baseClient.mockDynamicFields = [
			createTypeNameDynamicField('0x111', normalizeStructTag(COINS.testnet.sui.coinType)),
		];
		baseClient.mockDynamicFieldLookups = [
			{
				nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
				parentId: OBJECT_IDS.testnet.sweetHouse,
				nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
				childId: '0x222',
			},
			{
				nameBcs: SUI_TYPE_NAME_FIELD_BCS,
				parentId: '0x222',
				nameType: TypeName.name,
				childId: '0x111',
			},
		];
		const first = baseClient.$extend(suigar({ name: 'first' }));
		const second = baseClient.$extend(suigar({ name: 'second' }));

		await first.first.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});
		await second.second.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(baseClient.getDynamicObjectFieldCalls).toHaveLength(4);
		expect(baseClient.listDynamicFieldsCalls).toHaveLength(0);
		expect(baseClient.getObjectsCalls).toHaveLength(0);
	});

	it('keeps game parameter cache entries separate across settings package overrides', async () => {
		const coinflipPackageId = '0xcafe';
		const baseClient = new TestClient();
		baseClient.mockObjects = [createCoinflipParametersObject({ objectId: '0x111', minStake: 25n })];
		baseClient.mockDynamicFieldLookups = [
			{
				nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
				parentId: OBJECT_IDS.testnet.sweetHouse,
				nameType: `${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`,
				childId: '0x222',
			},
			{
				nameBcs: SUI_TYPE_NAME_FIELD_BCS,
				parentId: '0x222',
				nameType: TypeName.name,
				childId: '0x111',
			},
			{
				nameBcs: COINFLIP_SETTINGS_FIELD_BCS,
				parentId: OBJECT_IDS.testnet.sweetHouse,
				nameType: `${coinflipPackageId}::coinflip::CoinFlipSettingsKey`,
				childId: '0x333',
			},
			{
				nameBcs: SUI_TYPE_NAME_FIELD_BCS,
				parentId: '0x333',
				nameType: TypeName.name,
				childId: '0x111',
			},
		];
		const first = baseClient.$extend(suigar({ name: 'shared' }));
		const second = baseClient.$extend(
			suigar({
				name: 'shared',
				config: {
					packageIds: {
						coinflip: coinflipPackageId,
					},
				},
			}),
		);

		await first.shared.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});
		await second.shared.getGameParameters({
			game: 'coinflip',
			coinType: COINS.testnet.sui.coinType,
		});

		expect(baseClient.getDynamicObjectFieldCalls).toHaveLength(4);
		expect(baseClient.getDynamicObjectFieldCalls[0]?.name.type).toBe(
			normalizeStructTag(`${TEST_CONFIG.packageIds.coinflip}::coinflip::CoinFlipSettingsKey`),
		);
		expect(baseClient.getDynamicObjectFieldCalls[2]?.name.type).toBe(
			normalizeStructTag(`${coinflipPackageId}::coinflip::CoinFlipSettingsKey`),
		);
		expect(baseClient.listDynamicFieldsCalls).toHaveLength(0);
		expect(baseClient.getObjectsCalls).toHaveLength(0);
	});

	it('returns pvp coinflip games from the unresolved registry entries', async () => {
		const client = createSuigarTestClient({
			objects: [createPvPCoinflipGameObject('0xopen'), createPvPCoinflipGameObject('0xpending')],
			dynamicFields: [createDynamicField('0xopen'), createDynamicField('0xpending')],
		});
		vi.spyOn(client.suigar.bcs.PvPCoinflipGame, 'parse')
			.mockReturnValueOnce(createParsedPvPCoinflipGame('0xopen'))
			.mockReturnValueOnce(createParsedPvPCoinflipGame('0xpending'));

		const games = await client.suigar.getPvPCoinflipGames();

		expect(games).toHaveLength(2);
		expect(games[0]?.id).toBe('0xopen');
		expect(games[1]?.id).toBe('0xpending');
	});

	it('resolves the pvp coinflip registry with the default package key type', async () => {
		const client = createSuigarTestClient();

		await client.suigar.getPvPCoinflipGames();

		expect(client.getDynamicObjectFieldCalls[0]?.name).toEqual({
			type: normalizeStructTag(
				PvpCoinflipRegistryKey.typeTag({
					package: TEST_CONFIG.packageIds.pvpCoinflip,
				}),
			),
			bcs: PVP_COINFLIP_REGISTRY_FIELD_BCS,
		});
		expect(client.listDynamicFieldsCalls[0]?.parentId).toBe(TEST_CONFIG.registryIds.pvpCoinflip);
	});

	it('resolves the pvp coinflip registry with an overridden package key type', async () => {
		const pvpCoinflipPackageId = '0xface';
		const client = createSuigarTestClient({
			config: {
				packageIds: {
					pvpCoinflip: pvpCoinflipPackageId,
				},
			},
		});

		await client.suigar.getPvPCoinflipGames();

		expect(client.getDynamicObjectFieldCalls[0]?.name).toEqual({
			type: normalizeStructTag(
				PvpCoinflipRegistryKey.typeTag({
					package: pvpCoinflipPackageId,
				}),
			),
			bcs: PVP_COINFLIP_REGISTRY_FIELD_BCS,
		});
		expect(client.listDynamicFieldsCalls[0]?.parentId).toBe(TEST_CONFIG.registryIds.pvpCoinflip);
	});

	it('caches the pvp coinflip registry id through the base Mysten client', async () => {
		const client = createSuigarTestClient();

		await client.suigar.getPvPCoinflipGames();
		await client.suigar.getPvPCoinflipGames();

		expect(client.getDynamicObjectFieldCalls).toHaveLength(1);
		expect(client.listDynamicFieldsCalls).toHaveLength(2);
		expect(client.listDynamicFieldsCalls[0]?.parentId).toBe(TEST_CONFIG.registryIds.pvpCoinflip);
		expect(client.listDynamicFieldsCalls[1]?.parentId).toBe(TEST_CONFIG.registryIds.pvpCoinflip);
	});

	it('keeps pvp coinflip registry cache entries separate across package overrides', async () => {
		const pvpCoinflipPackageId = '0xface';
		const baseClient = new TestClient();
		baseClient.mockDynamicFieldLookups = [
			{
				childId: '0x111',
				parentId: OBJECT_IDS.testnet.sweetHouse,
				nameType: `${TEST_CONFIG.packageIds.pvpCoinflip}::pvp_coinflip::PvpCoinflipRegistryKey`,
			},
			{
				childId: '0x222',
				parentId: OBJECT_IDS.testnet.sweetHouse,
				nameType: `${pvpCoinflipPackageId}::pvp_coinflip::PvpCoinflipRegistryKey`,
			},
		];
		const first = baseClient.$extend(suigar({ name: 'shared' }));
		const second = baseClient.$extend(
			suigar({
				name: 'shared',
				config: {
					packageIds: {
						pvpCoinflip: pvpCoinflipPackageId,
					},
				},
			}),
		);

		await first.shared.getPvPCoinflipGames();
		await second.shared.getPvPCoinflipGames();

		expect(baseClient.getDynamicObjectFieldCalls).toHaveLength(2);
		expect(baseClient.listDynamicFieldsCalls.map(({ parentId }) => parentId)).toEqual([
			'0x111',
			'0x222',
		]);
	});

	it('forwards signal from getPvPCoinflipGames options into getObjects', async () => {
		const client = createSuigarTestClient({
			objects: [createPvPCoinflipGameObject('0xopen')],
			dynamicFields: [createDynamicField('0xopen')],
		});
		const controller = new AbortController();
		const getObjectsSpy = vi.spyOn(client, 'getObjects');
		vi.spyOn(client.suigar.bcs.PvPCoinflipGame, 'parse').mockReturnValueOnce(
			createParsedPvPCoinflipGame('0xopen'),
		);

		await client.suigar.getPvPCoinflipGames({
			limit: 1,
			signal: controller.signal,
		});

		expect(getObjectsSpy).toHaveBeenCalledWith(
			expect.objectContaining({
				objectIds: ['0xopen'],
				signal: controller.signal,
				include: { content: true },
			}),
		);
	});

	it('skips unresolved PvP Coinflip games when throwOnError is false', async () => {
		const client = createSuigarTestClient({
			objects: [
				createPvPCoinflipGameObject('0xopen'),
				new Error('boom'),
				createPvPCoinflipGameObject('0xpending'),
			],
			dynamicFields: [
				createDynamicField('0xopen'),
				createDynamicField('0xbroken'),
				createDynamicField('0xpending'),
			],
		});
		vi.spyOn(client.suigar.bcs.PvPCoinflipGame, 'parse')
			.mockReturnValueOnce(createParsedPvPCoinflipGame('0xopen'))
			.mockReturnValueOnce(createParsedPvPCoinflipGame('0xpending'));

		const games = await client.suigar.getPvPCoinflipGames();

		expect(games).toHaveLength(2);
		expect(games.map((game) => game.id)).toEqual(['0xopen', '0xpending']);
	});

	it('exposes BCS schemas under their current event keys', async () => {
		const client = createSuigarTestClient();

		expect(client.suigar.bcs.NftV1Factory).toBeDefined();
		expect(client.suigar.bcs.NftV1).toBeDefined();
		expect(
			client.suigar.bcs.NftV1Factory.parse(
				client.suigar.bcs.NftV1Factory.serialize({
					id: '0x1',
					specs: {
						contents: [
							{
								key: '0x2',
								value: {
									id: '0x2',
									name: 'Suigar Cane',
									description: 'A Suigar NFT V1',
									url: { url: 'https://suigar.com/cane.png' },
									supply: 500n,
									available: 494n,
									price: 15n,
								},
							},
						],
					},
				}).toBytes(),
			).specs.contents[0]?.value.url.url,
		).toBe('https://suigar.com/cane.png');
		expect(client.suigar.bcs.PvPCoinflipGame).toBeDefined();
		expect(client.suigar.bcs.BetResultEvent).toBeDefined();
		expect(client.suigar.bcs.PvPCoinflipGameCreatedEvent).toBeDefined();
		expect(client.suigar.bcs.PvPCoinflipGameResolvedEvent).toBeDefined();
		expect(client.suigar.bcs.PvPCoinflipGameCancelledEvent).toBeDefined();
	});

	it('rejects unresolved PvP Coinflip games when throwOnError is true', async () => {
		const client = createSuigarTestClient({
			objects: [createPvPCoinflipGameObjectWithoutContent('0xbroken')],
			dynamicFields: [createDynamicField('0xbroken')],
		});
		await expect(client.suigar.getPvPCoinflipGames({ throwOnError: true })).rejects.toThrow(
			'Unable to resolve PvP Coinflip game from retrieved object',
		);
	});

	it('forwards object lookup options when resolving PvP Coinflip registry games', async () => {
		const client = createSuigarTestClient({
			objects: [createPvPCoinflipGameObject('0xopen')],
			dynamicFields: [createDynamicField('0xopen')],
		});
		const controller = new AbortController();
		const getObjectsSpy = vi.spyOn(client, 'getObjects');
		vi.spyOn(client.suigar.bcs.PvPCoinflipGame, 'parse').mockReturnValueOnce(
			createParsedPvPCoinflipGame('0xopen'),
		);

		await client.suigar.getPvPCoinflipGames({
			signal: controller.signal,
		});

		expect(getObjectsSpy).toHaveBeenCalledWith({
			objectIds: ['0xopen'],
			signal: controller.signal,
			include: { content: true },
		});
	});
});
