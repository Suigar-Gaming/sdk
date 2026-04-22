// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { CoreClient } from '@mysten/sui/client';
import type { TransactionResult } from '@mysten/sui/transactions';
import { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
	buildCoinflipTransaction,
	buildPvPCoinflipTransaction,
} from '../src/transactions/index.js';
import { suigar } from '../src/client.js';

const TEST_CONFIG = {
	sweetHousePackageId: '0x456',
	coinTypes: {
		sui: normalizeStructTag('0x2::sui::SUI'),
		usdc: normalizeStructTag('0xusdc::coin::USDC'),
	},
	gamesPackageId: {
		coinflip: '0xabc',
		limbo: '0x1',
		plinko: '0x2',
		'pvp-coinflip': '0x3',
		range: '0x4',
		wheel: '0x5',
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
				referrer: '0x123',
				label: 'vip',
			},
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
			keys: ['referrer', 'label'],
			values: [
				Array.from(Buffer.from(normalizeSuiAddress('0x123').slice(2), 'hex')),
				Array.from(new TextEncoder().encode('vip')),
			],
		});
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
		expect(options.arguments[5]).toEqual(['label']);
		expect(options.arguments[6]).toEqual([
			Array.from(new TextEncoder().encode('vip')),
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
		expect(options.arguments[4]).toEqual(['label']);
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
			stake: 1000,
			gameId: '0x999',
			extraObjectId: '0x888',
			metadata: { label: 'vip' },
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package: string;
			arguments: unknown[];
		}>(joinGame);
		expect(options.package).toBe('0x3');
		expect(options.arguments[0]).toBe('0x999');
		expect(options.arguments[1]).toBe('0x456');
		expect(options.arguments[4]).toEqual([
			Array.from(new TextEncoder().encode('vip')),
		]);
		expect(options.arguments[5]).toBe('0x888');
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
				throw new Error('not implemented');
			};
			executeTransaction = async () => {
				throw new Error('not implemented');
			};
			simulateTransaction = async () => {
				throw new Error('not implemented');
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
				throw new Error('not implemented');
			};
			executeTransaction = async () => {
				throw new Error('not implemented');
			};
			simulateTransaction = async () => {
				throw new Error('not implemented');
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
});
