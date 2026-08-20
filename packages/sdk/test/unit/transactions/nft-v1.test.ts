// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeSuiAddress } from '@mysten/sui/utils';
import { describe, expect, it, vi } from 'vitest';
import { Factory as NftV1Factory } from '../../../src/contracts/nft-v1/nft.js';
import { buildMintNftV1Transaction } from '../../../src/transactions/nft-v1.js';
import { TEST_CONFIG } from '../../utils.js';
import './utils.js';

describe('NFT V1 transaction builder', () => {
	it('builds an NFT V1 mint with the configured specification price', async () => {
		const nftConfig = {
			...TEST_CONFIG,
			packageIds: {
				...TEST_CONFIG.packageIds,
				nftV1: '0x111',
			},
			objectIds: {
				...TEST_CONFIG.objectIds,
				nftV1Factory: '0x222',
			},
		};
		const client = {} as never;
		const getNftV1Factory = vi.spyOn(NftV1Factory, 'get').mockResolvedValue({
			json: {
				specs: {
					contents: [
						{
							key: '0x999',
							value: { id: '0x999', price: 15n },
						},
					],
				},
			},
		} as never);
		const tx = buildMintNftV1Transaction({
			owner: '0x123',
			specId: '0x999',
			useGasCoin: true,
			client,
			config: nftConfig,
		});
		const call = tx.getData().commands[1].MoveCall!;

		expect(tx.getData().sender).toBe(normalizeSuiAddress('0x123'));
		expect(call.package).toBe(normalizeSuiAddress(nftConfig.packageIds.nftV1));
		expect(call.function).toBe('mint_to_sender');
		expect(call.arguments).toHaveLength(4);
		expect(getNftV1Factory).toHaveBeenCalledWith({
			client,
			objectId: nftConfig.objectIds.nftV1Factory,
		});
	});
});
