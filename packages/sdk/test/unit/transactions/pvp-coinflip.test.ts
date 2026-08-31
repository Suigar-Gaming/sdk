// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { fromHex, normalizeStructTag, normalizeSuiAddress } from '@mysten/sui/utils';
import { describe, expect, it, vi } from 'vitest';
import { buildPvPCoinflipTransaction } from '../../../src/transactions/pvp-coinflip.js';
import { createContractCallMock, encodeUtf8, getFirstMockArg, TEST_CONFIG } from '../../utils.js';
import { createUnusedContractCallMock, loadTransactionModuleWithMock } from './utils.js';

describe('pvp coinflip transaction builder', () => {
	it('builds create and cancel transactions with configured package overrides', () => {
		const createTx = buildPvPCoinflipTransaction({
			action: 'create',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			stake: 1_000,
			side: 'tails',
			isPrivate: true,
			config: TEST_CONFIG,
		});
		const cancelTx = buildPvPCoinflipTransaction({
			action: 'cancel',
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

	it('passes create action arguments into the generated helper', async () => {
		const createGame = createContractCallMock();
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../../../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{
					createGame,
					joinGameV2: createUnusedContractCallMock(),
					cancelGame: createUnusedContractCallMock(),
				},
				'../../../src/transactions/pvp-coinflip.js',
			);
		const partner = normalizeSuiAddress('0x456');

		buildPvPCoinflipTransactionWithMock({
			action: 'create',
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
			package?: string;
			typeArguments: Array<string>;
			arguments: Array<unknown>;
		}>(createGame);
		expect(options.package).toBe(TEST_CONFIG.packageIds.pvpCoinflip);
		expect(options.typeArguments).toEqual([normalizeStructTag('0x2::sui::SUI')]);
		expect(options.arguments[0]).toBe(TEST_CONFIG.objectIds.sweetHouse);
		expect(options.arguments[2]).toBe(true);
		expect(options.arguments[3]).toBe(true);
		expect(options.arguments[4]).toEqual(['partner', 'label']);
		expect(options.arguments[5]).toEqual([Array.from(fromHex(partner)), encodeUtf8('vip')]);
	});

	it('passes join action arguments into the generated helper', async () => {
		const joinGameV2 = createContractCallMock();
		const getGame = vi
			.fn<() => Promise<{ json: { stake_per_player: bigint } }>>()
			.mockResolvedValue({
				json: {
					stake_per_player: 1000n,
				},
			});
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../../../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{
					createGame: createUnusedContractCallMock(),
					joinGameV2,
					cancelGame: createUnusedContractCallMock(),
					Game: {
						get: getGame,
					},
				},
				'../../../src/transactions/pvp-coinflip.js',
			);
		const partner = normalizeSuiAddress('0x456');
		const client = {} as never;

		buildPvPCoinflipTransactionWithMock({
			action: 'join',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			gameId: '0x999',
			client,
			metadata: { label: 'vip' },
			partner,
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package?: string;
			arguments: Array<unknown>;
		}>(joinGameV2);
		expect(options.package).toBe(TEST_CONFIG.packageIds.pvpCoinflip);
		expect(options.arguments[0]).toBe('0x999');
		expect(options.arguments[1]).toBe(TEST_CONFIG.objectIds.sweetHouse);
		expect(options.arguments[3]).toEqual(['partner', 'label']);
		expect(options.arguments[4]).toEqual([Array.from(fromHex(partner)), encodeUtf8('vip')]);
		expect(options.arguments[5]).toBe(TEST_CONFIG.coins.sui.priceInfoObjectId);
		await (options.arguments[2] as (tx: Transaction) => Promise<unknown>)(new Transaction());
		expect(getGame).toHaveBeenCalledWith({
			client,
			objectId: '0x999',
		});
	});

	it('passes cancel action arguments into the generated helper', async () => {
		const cancelGame = createContractCallMock();
		const { buildPvPCoinflipTransaction: buildPvPCoinflipTransactionWithMock } =
			await loadTransactionModuleWithMock<{
				buildPvPCoinflipTransaction: typeof buildPvPCoinflipTransaction;
			}>(
				'../../../src/contracts/pvp-coinflip/pvp_coinflip.js',
				{
					createGame: createUnusedContractCallMock(),
					joinGameV2: createUnusedContractCallMock(),
					cancelGame,
				},
				'../../../src/transactions/pvp-coinflip.js',
			);

		buildPvPCoinflipTransactionWithMock({
			action: 'cancel',
			owner: '0x123',
			coinType: '0x2::sui::SUI',
			gameId: '0x999',
			config: TEST_CONFIG,
		});

		const options = getFirstMockArg<{
			package?: string;
			arguments: Array<unknown>;
		}>(cancelGame);
		expect(options.package).toBe(TEST_CONFIG.packageIds.pvpCoinflip);
		expect(options.arguments).toEqual(['0x999', TEST_CONFIG.objectIds.sweetHouse]);
	});
});
