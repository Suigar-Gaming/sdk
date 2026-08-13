// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	Transaction,
	type TransactionArgument,
} from '@mysten/sui/transactions';
import { normalizeSuiAddress } from '@mysten/sui/utils';
import { Factory, mintToSender } from '../contracts/nft-v1/nft.js';
import type {
	MintNftV1Options,
	WithClient,
	WithConfig,
} from '../types/index.js';
import { createBaseTransaction } from './shared.js';

function buildMintNftV1PaymentCoin({
	client,
	config,
	specId,
	useGasCoin,
}: WithClient<
	WithConfig<Pick<MintNftV1Options, 'specId' | 'useGasCoin'>>
>): TransactionArgument {
	return async (tx) => {
		const { json: factory } = await Factory.get({
			client,
			objectId: config.objectIds.nftV1Factory,
		});
		const normalizedSpecId = normalizeSuiAddress(specId);
		const spec = factory.specs.contents.find(
			({ value }) => normalizeSuiAddress(value.id) === normalizedSpecId,
		)?.value;

		if (!spec) {
			throw new RangeError(`NFT V1 specification not found: ${specId}`);
		}

		return tx.coin({
			type: config.coins.sui.coinType,
			balance: BigInt(spec.price),
			useGasCoin,
		});
	};
}

export function buildMintNftV1Transaction({
	client,
	config,
	owner,
	gasBudget,
	specId,
	useGasCoin,
}: WithClient<WithConfig<MintNftV1Options>>): Transaction {
	const tx = createBaseTransaction({ owner, gasBudget });

	tx.add(
		mintToSender({
			package: config.packageIds.nftV1,
			arguments: [
				config.objectIds.nftV1Factory,
				config.objectIds.sweetHouse,
				specId,
				buildMintNftV1PaymentCoin({
					client,
					config,
					specId,
					useGasCoin,
				}),
			],
		}),
	);

	return tx;
}
