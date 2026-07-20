// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { coinWithBalance, Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
	buildCoinflipTransaction,
	buildPvPCoinflipTransaction,
} from '../../src/transactions/index.js';
import {
	createContractCallMock,
	encodeUtf8,
	getFirstMockArg,
	TEST_CONFIG,
} from './utils.js';

afterEach(() => {
	vi.resetModules();
	vi.clearAllMocks();
});

export async function loadTransactionModuleWithMock<
	TModule extends Record<string, unknown>,
>(
	contractPath: string,
	mockExports: Record<string, unknown>,
	transactionModulePath: string,
) {
	vi.doMock(contractPath, () => mockExports);
	return (await import(transactionModulePath)) as TModule;
}

function createZeroCoinThunk(coinType: string) {
	return (tx: Transaction) =>
		tx.moveCall({
			target: '0x2::coin::zero',
			typeArguments: [coinType],
		});
}

type ContractCallMock = (options: unknown) => (tx: Transaction) => unknown;

function createUnusedContractCallMock() {
	return vi.fn<ContractCallMock>();
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
		const data = tx.getData();

		expect(data.sender).toBe(normalizeSuiAddress('0x123'));
		expect(data.commands[0].$kind).toBe('$Intent');
		expect(data.commands[1].$kind).toBe('MoveCall');
		expect(data.commands[1].MoveCall!.package).toBe(
			normalizeSuiAddress(TEST_CONFIG.packageIds.coinflip),
		);
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

		const createData = createTx.getData();
		const cancelData = cancelTx.getData();

		expect(createData.sender).toBe(normalizeSuiAddress('0x123'));
		expect(cancelData.sender).toBe(normalizeSuiAddress('0x123'));
		expect(createData.commands[1].$kind).toBe('MoveCall');
		expect(cancelData.commands[0].$kind).toBe('MoveCall');
		expect(createData.commands[1].MoveCall!.package).toBe(
			normalizeSuiAddress(TEST_CONFIG.packageIds.pvpCoinflip),
		);
		expect(cancelData.commands[0].MoveCall!.package).toBe(
			normalizeSuiAddress(TEST_CONFIG.packageIds.pvpCoinflip),
		);
	});
});

describe('shared transaction helpers', () => {
	it('creates a base transaction with normalized owner address and configured gas budget', async () => {
		const { createBaseGameTransaction } =
			await import('../../src/transactions/shared.js');

		const tx = createBaseGameTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			gasBudget: 999,
		});
		const data = tx.getData();

		expect(data.sender).toBe(normalizeSuiAddress('0xabc'));
		expect(data.gasData?.budget).toBe('999');
	});

	it('resolves standard game bet context before invoking the reward builder', async () => {
		const { buildSharedStandardGameBetTransaction } =
			await import('../../src/transactions/shared.js');

		type BuildRewardContext = Parameters<
			Parameters<
				typeof buildSharedStandardGameBetTransaction
			>[0]['buildRewardCoin']
		>[0];
		let context: BuildRewardContext | undefined;

		const partner = normalizeSuiAddress('0x123');
		const tx = buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			cashStake: 2500,
			betCount: 3,
			metadata: {
				label: 'vip',
			},
			partner,
			useGasCoin: false,
			buildRewardCoin: (resolvedContext) => {
				context = resolvedContext;
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(tx.getData().commands).toHaveLength(2);
		expect(context!).toBeDefined();
		expect(context!.betCoin).toBeTypeOf('function');
		expect(context!.owner).toBe(normalizeSuiAddress('0xabc'));
		expect(context!.coinType).toBe(normalizeStructTag('0x2::sui::SUI'));
		expect(context!.stake).toBe(1000n);
		expect(context!.cashStake).toBe(2500n);
		expect(context!.betCount).toBe(3n);
		expect(context!.priceInfoObjectId).toBe(
			TEST_CONFIG.coins.sui.priceInfoObjectId,
		);
		expect(context!.metadata).toEqual({
			keys: ['partner', 'label'],
			values: [
				Array.from(Buffer.from(partner.slice(2), 'hex')),
				encodeUtf8('vip'),
			],
		});
	});

	it('does not default useGasCoin in Mysten coin intent options', async () => {
		const coinWithBalanceMock = vi.fn<
			({ type }: { type: string }) => ReturnType<typeof createZeroCoinThunk>
		>(({ type }) => createZeroCoinThunk(type));
		vi.doMock('@mysten/sui/transactions', async (importOriginal) => {
			const actual =
				await importOriginal<typeof import('@mysten/sui/transactions')>();
			return {
				...actual,
				coinWithBalance: coinWithBalanceMock,
			};
		});

		const { buildSharedStandardGameBetTransaction } =
			await import('../../src/transactions/shared.js');

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			buildRewardCoin: (resolvedContext) => {
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(coinWithBalanceMock).toHaveBeenLastCalledWith({
			type: normalizeStructTag('0x2::sui::SUI'),
			balance: 1000n,
			useGasCoin: undefined,
		});

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0xabc',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			useGasCoin: false,
			buildRewardCoin: (resolvedContext) => {
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

		expect(coinWithBalanceMock).toHaveBeenLastCalledWith({
			type: normalizeStructTag('0x2::sui::SUI'),
			balance: 1000n,
			useGasCoin: false,
		});
	});

	it('warns and skips reserved metadata keys', async () => {
		const { buildSharedStandardGameBetTransaction } =
			await import('../../src/transactions/shared.js');
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

		buildSharedStandardGameBetTransaction({
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
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});

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

	it('encodes wallet addresses in non-reserved metadata values', async () => {
		const { buildSharedStandardGameBetTransaction } =
			await import('../../src/transactions/shared.js');
		const accountManager = normalizeSuiAddress('0x456');

		buildSharedStandardGameBetTransaction({
			config: TEST_CONFIG,
			game: 'coinflip',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			metadata: {
				accountManager,
				label: 'vip',
			},
			buildRewardCoin: (resolvedContext) => {
				expect(resolvedContext.metadata).toEqual({
					keys: ['accountManager', 'label'],
					values: [
						Array.from(Buffer.from(accountManager.slice(2), 'hex')),
						encodeUtf8('vip'),
					],
				});
				return createZeroCoinThunk(resolvedContext.coinType);
			},
		});
	});
});

describe('coinflip transaction wrapper', () => {
	it('passes normalized arguments to the generated coinflip contract helper', async () => {
		const play = createContractCallMock();

		const { buildCoinflipTransaction: buildCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildCoinflipTransaction: typeof buildCoinflipTransaction;
			}>(
				'../../src/contracts/coinflip/coinflip.js',
				{ play },
				'../../src/transactions/coinflip.js',
			);
		const partner = normalizeSuiAddress('0x456');

		buildCoinflipTransactionWithMock({
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			betCount: 2,
			side: 'tails',
			metadata: { label: 'vip' },
			partner,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package: string;
			typeArguments: string[];
			arguments: unknown[];
		}>(play);

		expect(options.package).toBe(TEST_CONFIG.packageIds.coinflip);
		expect(options.typeArguments).toEqual([
			normalizeStructTag('0x2::sui::SUI'),
		]);
		expect(options.arguments[0]).toBe(TEST_CONFIG.packageIds.sweetHouse);
		expect(options.arguments[1]).toBe(1000n);
		expect(options.arguments[3]).toBe(2n);
		expect(options.arguments[4]).toBe(true);
		expect(options.arguments[5]).toEqual(['partner', 'label']);
		expect(options.arguments[6]).toEqual([
			Array.from(Buffer.from(partner.slice(2), 'hex')),
			encodeUtf8('vip'),
		]);
		expect(options.arguments[7]).toBe(TEST_CONFIG.coins.sui.priceInfoObjectId);
	});
});

describe('limbo transaction wrapper', () => {
	it('converts target multiplier using the default scale', async () => {
		const play = createContractCallMock();
		const { buildLimboTransaction } = await loadTransactionModuleWithMock<{
			buildLimboTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../../src/contracts/limbo/limbo.js',
			{ play },
			'../../src/transactions/limbo.js',
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
		const play = createContractCallMock();
		const { buildLimboTransaction } = await loadTransactionModuleWithMock<{
			buildLimboTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../../src/contracts/limbo/limbo.js',
			{ play },
			'../../src/transactions/limbo.js',
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
		const play = createContractCallMock();
		const { buildPlinkoTransaction } = await loadTransactionModuleWithMock<{
			buildPlinkoTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../../src/contracts/plinko/plinko.js',
			{ play },
			'../../src/transactions/plinko.js',
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
			await import('../../src/transactions/plinko.js');

		expect(() =>
			buildPlinkoTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: 256,
				config: TEST_CONFIG,
			}),
		).toThrow('Value must be a u8 integer');
	});
});

describe('range transaction wrapper', () => {
	it('converts range points and out-of-range flag before calling the generated helper', async () => {
		const play = createContractCallMock();
		const { buildRangeTransaction } = await loadTransactionModuleWithMock<{
			buildRangeTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../../src/contracts/range/range.js',
			{ play },
			'../../src/transactions/range.js',
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
		const play = createContractCallMock();
		const { buildWheelTransaction } = await loadTransactionModuleWithMock<{
			buildWheelTransaction: (
				options: Record<string, unknown>,
			) => ReturnType<typeof buildCoinflipTransaction>;
		}>(
			'../../src/contracts/wheel/wheel.js',
			{ play },
			'../../src/transactions/wheel.js',
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
			await import('../../src/transactions/wheel.js');

		expect(() =>
			buildWheelTransaction({
				owner: '0x123',
				coinType: '0x2::sui::SUI',
				stake: 1000,
				configId: -1,
				config: TEST_CONFIG,
			}),
		).toThrow('Value must be a u8 integer');
	});
});

describe('pvp coinflip transaction wrapper', () => {
	it('passes create action arguments into the generated helper', async () => {
		const createGame = createContractCallMock();
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{
					createGame,
					joinGame: createUnusedContractCallMock(),
					cancelGame: createUnusedContractCallMock(),
				},
				'../../src/transactions/pvp-coinflip.js',
			);
		const partner = normalizeSuiAddress('0x456');

		buildPvPCoinflipTransactionWithMock('create', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1000,
			side: 'tails',
			isPrivate: true,
			metadata: { label: 'vip' },
			partner,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package: string;
			typeArguments: string[];
			arguments: unknown[];
		}>(createGame);
		expect(options.package).toBe(TEST_CONFIG.packageIds.pvpCoinflip);
		expect(options.typeArguments).toEqual([
			normalizeStructTag('0x2::sui::SUI'),
		]);
		expect(options.arguments[0]).toBe(TEST_CONFIG.packageIds.sweetHouse);
		expect(options.arguments[2]).toBe(true);
		expect(options.arguments[3]).toBe(true);
		expect(options.arguments[4]).toEqual(['partner', 'label']);
		expect(options.arguments[5]).toEqual([
			Array.from(Buffer.from(partner.slice(2), 'hex')),
			encodeUtf8('vip'),
		]);
	});

	it('passes join action arguments into the generated helper', async () => {
		const joinGame = createContractCallMock();
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{
					createGame: createUnusedContractCallMock(),
					joinGame,
					cancelGame: createUnusedContractCallMock(),
				},
				'../../src/transactions/pvp-coinflip.js',
			);
		const partner = normalizeSuiAddress('0x456');

		buildPvPCoinflipTransactionWithMock('join', {
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			gameId: '0x999',
			metadata: { label: 'vip' },
			partner,
			config: TEST_CONFIG,
			betCoin: coinWithBalance({ type: '0x2::sui::SUI', balance: 1000 }),
		});

		const options = getFirstMockArg<{
			package: string;
			arguments: unknown[];
		}>(joinGame);
		expect(options.package).toBe(TEST_CONFIG.packageIds.pvpCoinflip);
		expect(options.arguments[0]).toBe('0x999');
		expect(options.arguments[1]).toBe(TEST_CONFIG.packageIds.sweetHouse);
		expect(options.arguments[3]).toEqual(['partner', 'label']);
		expect(options.arguments[4]).toEqual([
			Array.from(Buffer.from(partner.slice(2), 'hex')),
			encodeUtf8('vip'),
		]);
		expect(options.arguments[5]).toBe(TEST_CONFIG.coins.sui.priceInfoObjectId);
	});

	it('passes cancel action arguments into the generated helper', async () => {
		const cancelGame = createContractCallMock();
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{
					createGame: createUnusedContractCallMock(),
					joinGame: createUnusedContractCallMock(),
					cancelGame,
				},
				'../../src/transactions/pvp-coinflip.js',
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
		expect(options.arguments).toEqual([
			'0x999',
			TEST_CONFIG.packageIds.sweetHouse,
		]);
	});
});
