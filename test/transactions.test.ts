// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { CoreClient, type SuiClientTypes } from '@mysten/sui/client';
import type { TransactionResult } from '@mysten/sui/transactions';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	buildCoinflipTransaction,
	buildPvPCoinflipTransaction,
} from '../src/transactions/index.js';
import { suigar } from '../src/client.js';
import { encodeUtf8 } from './utils.js';

const TEST_CONFIG = {
	packageIds: {
		sweetHouse: '0x456',
		core: '0xcore',
		coinflip: '0xabc',
		limbo: '0x1',
		plinko: '0x2',
		pvpCoinflip: '0x3',
		range: '0x4',
		wheel: '0x5',
	},
	registryIds: {
		pvpCoinflip: '0xregistry',
	},
	coinTypes: {
		sui: normalizeStructTag('0x2::sui::SUI'),
		usdc: normalizeStructTag('0xusdc::coin::USDC'),
	},
	priceInfoObjectIds: {
		sui: '0x789',
		usdc: '0x987',
	},
} as const;

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

async function loadTransactionModuleWithMock<
	TModule extends Record<string, unknown>,
>(
	contractPath: string,
	mockExports: Record<string, unknown>,
	transactionModulePath: string,
) {
	vi.doMock(contractPath, () => mockExports);
	return (await import(transactionModulePath)) as TModule;
}

function getFirstMockArg<T>(mock: { mock: { calls: unknown[][] } }): T {
	return mock.mock.calls[0]?.[0] as T;
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

describe('transaction builders', () => {
	it('builds a coinflip transaction with the configured package id', () => {
		const tx = buildCoinflipTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1_000,
			side: 'heads',
			config: TEST_CONFIG,
		});
		const data = tx.getData() as {
			sender: string | null;
			commands: Array<Record<string, unknown> & { $kind: string }>;
		};

		expect(data.sender).toBe(normalizeSuiAddress('0x123'));
		expect(data.commands[0].$kind).toBe('$Intent');
		expect(data.commands[1].$kind).toBe('MoveCall');
		expect(
			(data.commands[1] as unknown as { MoveCall: { package: string } })
				.MoveCall.package,
		).toBe(normalizeSuiAddress('0xabc'));
	});

	it('builds pvp coinflip create and cancel transactions with the configured package id', () => {
		const createTx = buildPvPCoinflipTransaction('create', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1_000,
			side: 'tails',
			isPrivate: true,
			config: TEST_CONFIG,
		});
		const cancelTx = buildPvPCoinflipTransaction('cancel', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			gameId: '0x999',
			config: TEST_CONFIG,
		});

		const createData = createTx.getData() as {
			sender: string | null;
			commands: Array<Record<string, unknown> & { $kind: string }>;
		};
		const cancelData = cancelTx.getData() as {
			sender: string | null;
			commands: Array<Record<string, unknown> & { $kind: string }>;
		};

		expect(createData.sender).toBe(normalizeSuiAddress('0x123'));
		expect(cancelData.sender).toBe(normalizeSuiAddress('0x123'));
		expect(createData.commands[1].$kind).toBe('MoveCall');
		expect(cancelData.commands[0].$kind).toBe('MoveCall');
		expect(
			(createData.commands[1] as unknown as { MoveCall: { package: string } })
				.MoveCall.package,
		).toBe(normalizeSuiAddress('0x3'));
		expect(
			(cancelData.commands[0] as unknown as { MoveCall: { package: string } })
				.MoveCall.package,
		).toBe(normalizeSuiAddress('0x3'));
	});
});

describe('shared transaction helpers', () => {
	it('creates a base transaction with normalized sender and configured gas budget', async () => {
		const { createBaseGameTransaction } =
			await import('../src/transactions/shared.js');

		const tx = createBaseGameTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0x123',
			sender: '0xabc',
			gasBudget: 999,
		});
		const data = tx.getData() as {
			sender: string | null;
			gasData?: { budget?: string | number | bigint | null };
		};

		expect(data.sender).toBe(normalizeSuiAddress('0xabc'));
		expect(data.gasData?.budget).toBe('999');
	});

	it('resolves standard game bet context before invoking the reward builder', async () => {
		const { buildSharedStandardGameBetCall } =
			await import('../src/transactions/shared.js');

		let context: Parameters<
			typeof buildSharedStandardGameBetCall
		>[0]['buildRewardCoin'] extends (ctx: infer T) => unknown
			? T
			: never | undefined;

		const tx = new Transaction();
		const partner = normalizeSuiAddress('0x123');
		const reward = buildSharedStandardGameBetCall({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0x123',
			sender: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			cashStake: 2500,
			betCount: 3,
			metadata: {
				label: 'vip',
			},
			partner,
			allowGasCoinShortcut: false,
			buildRewardCoin: (resolvedContext) => {
				context = resolvedContext;
				return resolvedContext.tx.object(
					'0x777',
				) as unknown as TransactionResult;
			},
		})(tx);

		expect(reward).toBeDefined();
		expect(context!).toBeDefined();
		expect(context!.owner).toBe(normalizeSuiAddress('0xabc'));
		expect(context!.coinType).toBe(normalizeStructTag('0x2::sui::SUI'));
		expect(context!.stake).toBe(1000n);
		expect(context!.cashStake).toBe(2500n);
		expect(context!.betCount).toBe(3n);
		expect(context!.priceInfoObjectId).toBe('0x789');
		expect(context!.metadata).toEqual({
			keys: ['label', 'partner'],
			values: [
				encodeUtf8('vip'),
				Array.from(Buffer.from(partner.slice(2), 'hex')),
			],
		});
	});

	it('warns and skips reserved metadata keys', async () => {
		const { buildSharedStandardGameBetCall } =
			await import('../src/transactions/shared.js');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		buildSharedStandardGameBetCall({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			metadata: {
				referrer: '0x123',
				partner: 'manual',
				label: 'vip',
			},
			buildRewardCoin: (resolvedContext) => {
				expect(resolvedContext.metadata).toEqual({
					keys: ['label'],
					values: [encodeUtf8('vip')],
				});
				return resolvedContext.tx.object(
					'0x777',
				) as unknown as TransactionResult;
			},
		})(new Transaction());

		expect(warn).toHaveBeenCalledTimes(2);
		expect(warn).toHaveBeenNthCalledWith(
			1,
			'Metadata key "referrer" is reserved and will be ignored when parsing metadata.',
		);
		expect(warn).toHaveBeenNthCalledWith(
			2,
			'Metadata key "partner" is reserved and will be ignored when parsing metadata.',
		);
		warn.mockRestore();
	});
});

describe('coinflip transaction wrapper', () => {
	it('passes normalized arguments to the generated coinflip contract helper', async () => {
		const play = vi.fn((_: unknown) => {
			return (tx: Transaction) => tx.object('0x777');
		});

		const { buildCoinflipTransaction: buildCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildCoinflipTransaction: typeof buildCoinflipTransaction;
			}>(
				'../src/contracts/coinflip/coinflip.js',
				{ play },
				'../src/transactions/coinflip.js',
			);

		buildCoinflipTransactionWithMock({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			betCount: 2,
			side: 'tails',
			metadata: { label: 'vip' },
			partner: 'vip',
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package: string;
			typeArguments: string[];
			arguments: unknown[];
		}>(play);

		expect(options.package).toBe('0xabc');
		expect(options.typeArguments).toEqual([
			normalizeStructTag('0x2::sui::SUI'),
		]);
		expect(options.arguments[0]).toBe('0x456');
		expect(options.arguments[1]).toBe(1000n);
		expect(options.arguments[3]).toBe(2n);
		expect(options.arguments[4]).toBe(true);
		expect(options.arguments[5]).toEqual(['label', 'partner']);
		expect(options.arguments[6]).toEqual([
			encodeUtf8('vip'),
			encodeUtf8('vip'),
		]);
		expect(options.arguments[7]).toBe('0x789');
	});
});

describe('limbo transaction wrapper', () => {
	it('converts target multiplier using the default scale', async () => {
		const play = vi.fn((_: unknown) => (tx: Transaction) => tx.object('0x777'));
		const { buildLimboTransaction } = await loadTransactionModuleWithMock<{
			buildLimboTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../src/contracts/limbo/limbo.js',
			{ play },
			'../src/transactions/limbo.js',
		);

		buildLimboTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			targetMultiplier: 2.5,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(play);
		expect(options.arguments[4]).toBe(250n);
		expect(options.arguments[5]).toBe(100n);
	});

	it('respects a custom limbo scale', async () => {
		const play = vi.fn((_: unknown) => (tx: Transaction) => tx.object('0x777'));
		const { buildLimboTransaction } = await loadTransactionModuleWithMock<{
			buildLimboTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../src/contracts/limbo/limbo.js',
			{ play },
			'../src/transactions/limbo.js',
		);

		buildLimboTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			targetMultiplier: 2.5,
			scale: 1_000,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(play);
		expect(options.arguments[4]).toBe(2500n);
		expect(options.arguments[5]).toBe(1000n);
	});
});

describe('plinko transaction wrapper', () => {
	it('passes the validated config id into the generated helper', async () => {
		const play = vi.fn((_: unknown) => (tx: Transaction) => tx.object('0x777'));
		const { buildPlinkoTransaction } = await loadTransactionModuleWithMock<{
			buildPlinkoTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../src/contracts/plinko/plinko.js',
			{ play },
			'../src/transactions/plinko.js',
		);

		buildPlinkoTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			configId: 7,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(play);
		expect(options.arguments[4]).toBe(7);
	});

	it('rejects config ids outside the u8 range', async () => {
		const { buildPlinkoTransaction } =
			await import('../src/transactions/plinko.js');

		expect(() =>
			buildPlinkoTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: 256,
				config: TEST_CONFIG,
			}),
		).toThrow('configId must be an integer between 0 and 255');
	});
});

describe('range transaction wrapper', () => {
	it('converts range points and out-of-range flag before calling the generated helper', async () => {
		const play = vi.fn((_: unknown) => (tx: Transaction) => tx.object('0x777'));
		const { buildRangeTransaction } = await loadTransactionModuleWithMock<{
			buildRangeTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../src/contracts/range/range.js',
			{ play },
			'../src/transactions/range.js',
		);

		buildRangeTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			leftPoint: 0.95,
			rightPoint: 1.05,
			outOfRange: true,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(play);
		expect(options.arguments[4]).toBe(950000n);
		expect(options.arguments[5]).toBe(1050000n);
		expect(options.arguments[6]).toBe(true);
	});
});

describe('wheel transaction wrapper', () => {
	it('passes the validated wheel config id into the generated helper', async () => {
		const play = vi.fn((_: unknown) => (tx: Transaction) => tx.object('0x777'));
		const { buildWheelTransaction } = await loadTransactionModuleWithMock<{
			buildWheelTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../src/contracts/wheel/wheel.js',
			{ play },
			'../src/transactions/wheel.js',
		);

		buildWheelTransaction({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			configId: 9,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(play);
		expect(options.arguments[4]).toBe(9);
	});

	it('rejects invalid wheel config ids', async () => {
		const { buildWheelTransaction } =
			await import('../src/transactions/wheel.js');

		expect(() =>
			buildWheelTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: -1,
				config: TEST_CONFIG,
			}),
		).toThrow('configId must be an integer between 0 and 255');
	});
});

describe('pvp coinflip transaction wrapper', () => {
	it('passes create action arguments into the generated helper', async () => {
		const createGame = vi.fn(
			(_: unknown) => (tx: Transaction) => tx.object('0x777'),
		);
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{ createGame, joinGame: vi.fn(), cancelGame: vi.fn() },
				'../src/transactions/pvp-coinflip.js',
			);

		buildPvPCoinflipTransactionWithMock('create', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			side: 'tails',
			isPrivate: true,
			metadata: { label: 'vip' },
			partner: 'vip',
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package: string;
			typeArguments: string[];
			arguments: unknown[];
		}>(createGame);
		expect(options.package).toBe('0x3');
		expect(options.typeArguments).toEqual([
			normalizeStructTag('0x2::sui::SUI'),
		]);
		expect(options.arguments[0]).toBe('0x456');
		expect(options.arguments[2]).toBe(true);
		expect(options.arguments[3]).toBe(true);
		expect(options.arguments[4]).toEqual(['label', 'partner']);
	});

	it('passes join action arguments into the generated helper', async () => {
		const joinGame = vi.fn(
			(_: unknown) => (tx: Transaction) => tx.object('0x777'),
		);
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{ createGame: vi.fn(), joinGame, cancelGame: vi.fn() },
				'../src/transactions/pvp-coinflip.js',
			);

		buildPvPCoinflipTransactionWithMock('join', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			gameId: '0x999',
			metadata: { label: 'vip' },
			partner: 'vip',
			config: TEST_CONFIG,
			betCoin: (tx: Transaction) => Promise.resolve(tx.coin({ balance: 1000 })),
		});

		const options = getFirstMockArg<{
			package: string;
			arguments: unknown[];
		}>(joinGame);
		expect(options.package).toBe('0x3');
		expect(options.arguments[0]).toBe('0x999');
		expect(options.arguments[1]).toBe('0x456');
		expect(options.arguments[3]).toEqual(['label', 'partner']);
		expect(options.arguments[4]).toEqual([
			encodeUtf8('vip'),
			encodeUtf8('vip'),
		]);
		expect(options.arguments[5]).toBe('0x789');
	});

	it('passes cancel action arguments into the generated helper', async () => {
		const cancelGame = vi.fn(
			(_: unknown) => (tx: Transaction) => tx.object('0x777'),
		);
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{ createGame: vi.fn(), joinGame: vi.fn(), cancelGame },
				'../src/transactions/pvp-coinflip.js',
			);

		buildPvPCoinflipTransactionWithMock('cancel', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			gameId: '0x999',
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(cancelGame);
		expect(options.arguments).toEqual(['0x999', '0x456']);
	});
});

describe('SuigarClient', () => {
	it('creates an extension-compatible client surface', () => {
		class TestClient extends CoreClient {
			constructor() {
				super({ network: 'testnet', base: undefined as never });
			}

			getObjects = async () => ({ objects: [] });
			listCoins = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			listOwnedObjects = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			getBalance = async () => ({
				balance: {
					coinType: '0x2::sui::SUI',
					balance: '0',
					coinBalance: '0',
					addressBalance: '0',
				},
			});
			listBalances = async () => ({
				balances: [],
				hasNextPage: false,
				cursor: null,
			});
			getCoinMetadata = async () => ({ coinMetadata: null });
			getTransaction = async () => {
				throw new Error('Not implemented.');
			};
			executeTransaction = async () => {
				throw new Error('Not implemented.');
			};
			simulateTransaction = async () => {
				throw new Error('Not implemented.');
			};
			getReferenceGasPrice = async () => ({
				referenceGasPrice: '0',
				price: '1',
			});
			getCurrentSystemState = async () => ({ epoch: '1' }) as never;
			getProtocolConfig = async () => ({ protocolConfig: {} }) as never;
			getChainIdentifier = async () => ({ chain: 'testnet' }) as never;
			listDynamicFields = async () => ({
				dynamicFields: [],
				hasNextPage: false,
				cursor: null,
			});
			resolveTransactionPlugin = () => async () => {};
			verifyZkLoginSignature = async () => ({ success: true }) as never;
			getMoveFunction = async () => ({ function: null }) as never;
			defaultNameServiceName = async () => ({ address: null }) as never;
		}

		const client = new TestClient().$extend(suigar());

		expect(client.suigar).toBeDefined();
		expect(client.suigar.serializeTransactionToBase64).toBeTypeOf('function');
	});

	it('injects the configured partner into standard-game metadata', async () => {
		const play = vi.fn((_: unknown) => {
			return (tx: Transaction) => tx.object('0x777');
		});

		vi.resetModules();
		await loadTransactionModuleWithMock(
			'../src/contracts/coinflip/coinflip.js',
			{ play },
			'../src/transactions/coinflip.js',
		);
		vi.doMock(
			'../src/contracts/pvp-coinflip/pvp_coinflip.js',
			async (importOriginal) => await importOriginal(),
		);
		const { suigar: mockedSuigar } = await import('../src/client.js');

		class TestClient extends CoreClient {
			constructor() {
				super({ network: 'testnet', base: undefined as never });
			}

			getObjects = async () => ({ objects: [] });
			listCoins = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			listOwnedObjects = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			getBalance = async () => ({
				balance: {
					coinType: '0x2::sui::SUI',
					balance: '0',
					coinBalance: '0',
					addressBalance: '0',
				},
			});
			listBalances = async () => ({
				balances: [],
				hasNextPage: false,
				cursor: null,
			});
			getCoinMetadata = async () => ({ coinMetadata: null });
			getTransaction = async () => {
				throw new Error('Not implemented.');
			};
			executeTransaction = async () => {
				throw new Error('Not implemented.');
			};
			simulateTransaction = async () => {
				throw new Error('Not implemented.');
			};
			getReferenceGasPrice = async () => ({
				referenceGasPrice: '0',
				price: '1',
			});
			getCurrentSystemState = async () => ({ epoch: '1' }) as never;
			getProtocolConfig = async () => ({ protocolConfig: {} }) as never;
			getChainIdentifier = async () => ({ chain: 'testnet' }) as never;
			listDynamicFields = async () => ({
				dynamicFields: [],
				hasNextPage: false,
				cursor: null,
			});
			resolveTransactionPlugin = () => async () => {};
			verifyZkLoginSignature = async () => ({ success: true }) as never;
			getMoveFunction = async () => ({ function: null }) as never;
			defaultNameServiceName = async () => ({ address: null }) as never;
		}

		const client = new TestClient().$extend(mockedSuigar({ partner: 'vip' }));
		const coinType = client.suigar.getConfig().coinTypes.sui;
		client.suigar.tx.createBetTransaction('coinflip', {
			owner: '0x123',
			coinType,
			stake: 1000,
			side: 'heads',
		});

		const options = getFirstMockArg<{
			arguments: unknown[];
		}>(play);
		expect(options.arguments[5]).toEqual(['partner']);
		expect(options.arguments[6]).toEqual([encodeUtf8('vip')]);
	});

	it('exposes both standard and pvp transaction factories', () => {
		class TestClient extends CoreClient {
			constructor() {
				super({ network: 'testnet', base: undefined as never });
			}

			getObjects = async () => ({ objects: [] });
			listCoins = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			listOwnedObjects = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			getBalance = async () => ({
				balance: {
					coinType: '0x2::sui::SUI',
					balance: '0',
					coinBalance: '0',
					addressBalance: '0',
				},
			});
			listBalances = async () => ({
				balances: [],
				hasNextPage: false,
				cursor: null,
			});
			getCoinMetadata = async () => ({ coinMetadata: null });
			getTransaction = async () => {
				throw new Error('Not implemented.');
			};
			executeTransaction = async () => {
				throw new Error('Not implemented.');
			};
			simulateTransaction = async () => {
				throw new Error('Not implemented.');
			};
			getReferenceGasPrice = async () => ({
				referenceGasPrice: '0',
				price: '1',
			});
			getCurrentSystemState = async () => ({ epoch: '1' }) as never;
			getProtocolConfig = async () => ({ protocolConfig: {} }) as never;
			getChainIdentifier = async () => ({ chain: 'testnet' }) as never;
			listDynamicFields = async () => ({
				dynamicFields: [],
				hasNextPage: false,
				cursor: null,
			});
			resolveTransactionPlugin = () => async () => {};
			verifyZkLoginSignature = async () => ({ success: true }) as never;
			getMoveFunction = async () => ({ function: null }) as never;
			defaultNameServiceName = async () => ({ address: null }) as never;
		}

		const client = new TestClient().$extend(suigar());

		expect(client.suigar.tx.createBetTransaction).toBeTypeOf('function');
		expect(client.suigar.tx.createPvPCoinflipTransaction).toBeTypeOf(
			'function',
		);
	});

	it('returns pvp coinflip games from the unresolved registry entries', async () => {
		class TestClient extends CoreClient {
			constructor() {
				super({ network: 'testnet', base: undefined as never });
			}

			getObjects = async () => ({ objects: [] });
			listCoins = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			listOwnedObjects = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			getBalance = async () => ({
				balance: {
					coinType: '0x2::sui::SUI',
					balance: '0',
					coinBalance: '0',
					addressBalance: '0',
				},
			});
			listBalances = async () => ({
				balances: [],
				hasNextPage: false,
				cursor: null,
			});
			getCoinMetadata = async () => ({ coinMetadata: null });
			getTransaction = async () => {
				throw new Error('Not implemented.');
			};
			executeTransaction = async () => {
				throw new Error('Not implemented.');
			};
			simulateTransaction = async () => {
				throw new Error('Not implemented.');
			};
			getReferenceGasPrice = async () => ({
				referenceGasPrice: '0',
				price: '1',
			});
			getCurrentSystemState = async () => ({ epoch: '1' }) as never;
			getProtocolConfig = async () => ({ protocolConfig: {} }) as never;
			getChainIdentifier = async () => ({ chain: 'testnet' }) as never;
			listDynamicFields = async () => ({
				dynamicFields: [
					createDynamicField('0xopen'),
					createDynamicField('0xpending'),
				],
				hasNextPage: false,
				cursor: null,
			});
			resolveTransactionPlugin = () => async () => {};
			verifyZkLoginSignature = async () => ({ success: true }) as never;
			getMoveFunction = async () => ({ function: null }) as never;
			defaultNameServiceName = async () => ({ address: null }) as never;
		}

		const client = new TestClient().$extend(suigar());
		vi.spyOn(client.suigar, 'resolvePvPConflipGame').mockImplementation(
			async (gameId: string) =>
				({
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
					coinType: '0x2::sui::SUI',
				}) as never,
		);

		const games = await client.suigar.getPvPCoinflipGames();

		expect(games).toHaveLength(2);
		expect(games[0]?.id).toBe('0xopen');
		expect(games[1]?.id).toBe('0xpending');
	});

	it('skips unresolved PvP coinflip games when throwOnError is false', async () => {
		class TestClient extends CoreClient {
			constructor() {
				super({ network: 'testnet', base: undefined as never });
			}

			getObjects = async () => ({ objects: [] });
			listCoins = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			listOwnedObjects = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			getBalance = async () => ({
				balance: {
					coinType: '0x2::sui::SUI',
					balance: '0',
					coinBalance: '0',
					addressBalance: '0',
				},
			});
			listBalances = async () => ({
				balances: [],
				hasNextPage: false,
				cursor: null,
			});
			getCoinMetadata = async () => ({ coinMetadata: null });
			getTransaction = async () => {
				throw new Error('Not implemented.');
			};
			executeTransaction = async () => {
				throw new Error('Not implemented.');
			};
			simulateTransaction = async () => {
				throw new Error('Not implemented.');
			};
			getReferenceGasPrice = async () => ({
				referenceGasPrice: '0',
				price: '1',
			});
			getCurrentSystemState = async () => ({ epoch: '1' }) as never;
			getProtocolConfig = async () => ({ protocolConfig: {} }) as never;
			getChainIdentifier = async () => ({ chain: 'testnet' }) as never;
			listDynamicFields = async () => ({
				dynamicFields: [
					createDynamicField('0xopen'),
					createDynamicField('0xbroken'),
					createDynamicField('0xpending'),
				],
				hasNextPage: false,
				cursor: null,
			});
			resolveTransactionPlugin = () => async () => {};
			verifyZkLoginSignature = async () => ({ success: true }) as never;
			getMoveFunction = async () => ({ function: null }) as never;
			defaultNameServiceName = async () => ({ address: null }) as never;
		}

		const client = new TestClient().$extend(suigar());
		vi.spyOn(client.suigar, 'resolvePvPConflipGame').mockImplementation(
			async (gameId: string) => {
				if (gameId === '0xbroken') {
					throw new Error('boom');
				}

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
					coinType: '0x2::sui::SUI',
				} as never;
			},
		);

		const games = await client.suigar.getPvPCoinflipGames();

		expect(games).toHaveLength(2);
		expect(games.map((game) => game.id)).toEqual(['0xopen', '0xpending']);
	});

	it('rejects unresolved PvP coinflip games when throwOnError is true', async () => {
		class TestClient extends CoreClient {
			constructor() {
				super({ network: 'testnet', base: undefined as never });
			}

			getObjects = async () => ({ objects: [] });
			listCoins = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			listOwnedObjects = async () => ({
				objects: [],
				hasNextPage: false,
				cursor: null,
			});
			getBalance = async () => ({
				balance: {
					coinType: '0x2::sui::SUI',
					balance: '0',
					coinBalance: '0',
					addressBalance: '0',
				},
			});
			listBalances = async () => ({
				balances: [],
				hasNextPage: false,
				cursor: null,
			});
			getCoinMetadata = async () => ({ coinMetadata: null });
			getTransaction = async () => {
				throw new Error('Not implemented.');
			};
			executeTransaction = async () => {
				throw new Error('Not implemented.');
			};
			simulateTransaction = async () => {
				throw new Error('Not implemented.');
			};
			getReferenceGasPrice = async () => ({
				referenceGasPrice: '0',
				price: '1',
			});
			getCurrentSystemState = async () => ({ epoch: '1' }) as never;
			getProtocolConfig = async () => ({ protocolConfig: {} }) as never;
			getChainIdentifier = async () => ({ chain: 'testnet' }) as never;
			listDynamicFields = async () => ({
				dynamicFields: [createDynamicField('0xbroken')],
				hasNextPage: false,
				cursor: null,
			});
			resolveTransactionPlugin = () => async () => {};
			verifyZkLoginSignature = async () => ({ success: true }) as never;
			getMoveFunction = async () => ({ function: null }) as never;
			defaultNameServiceName = async () => ({ address: null }) as never;
		}

		const client = new TestClient().$extend(suigar());
		vi.spyOn(client.suigar, 'resolvePvPConflipGame').mockRejectedValue(
			new Error('boom'),
		);

		await expect(
			client.suigar.getPvPCoinflipGames({ throwOnError: true }),
		).rejects.toThrow('boom');
	});
});
