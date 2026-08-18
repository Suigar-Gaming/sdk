// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	createSuigarClient,
	resolveOwnerAddress,
	toJsonValue,
	type ListNftsResult,
	type ReadGameMetadataResult,
	type ToolTextResult,
} from '../../runtime/index.js';
import { formatBaseUnitAmount } from '../../utils/index.js';
import type { ListNftsInput, ReadGameMetadataInput } from '../schemas/index.js';
import {
	asTextResponse,
	coinMetadataForAmount,
	formatGameParameters,
	GAME_LABELS,
	getConfigInput,
	getSuigarPackageId,
	requireGame,
	requireString,
	supportedFeatures,
	supportedGames,
} from './shared.js';

export async function readGameMetadataTool(
	input: Partial<ReadGameMetadataInput> = {},
): Promise<ToolTextResult> {
	const game = requireGame(input.game);
	const { client, config } = createSuigarClient(getConfigInput(input));
	const coin = coinMetadataForAmount(config, input.coinType);
	const ignoreCache = input.ignoreCache ?? true;
	const parameters = await client.suigar.getGameParameters({
		game,
		coinType: coin.coinType,
		ignoreCache,
	});

	return asTextResponse({
		network: config.network,
		config,
		supportedGames: supportedGames(),
		supportedFeatures: supportedFeatures(),
		game: {
			id: game,
			label: GAME_LABELS[game],
			packageId: getSuigarPackageId(config, game),
			coinType: coin.coinType,
			parameters: toJsonValue(formatGameParameters(parameters, coin.decimals)) ?? null,
			ignoreCache,
			notes: [
				'Parameters are loaded for the requested coin type from the on-chain game settings objects through client.suigar.getGameParameters().',
				ignoreCache
					? 'SDK parameter cache was ignored for this read.'
					: 'SDK parameter cache was allowed for this read.',
			],
		},
	} satisfies ReadGameMetadataResult);
}

export async function listNftsTool(input: Partial<ListNftsInput> = {}): Promise<ToolTextResult> {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(requireString(input.owner, 'owner'), bundle);
	const { client, config } = bundle;
	const nftV1PackageId = getSuigarPackageId(config, 'nftV1');
	const nftType = client.suigar.bcs.NftV1.typeTag({
		package: nftV1PackageId,
	});
	const factory = await client.core.getObject({
		objectId: config.sdk.objectIds.nftV1Factory,
		include: { content: true },
	});
	const catalog = client.suigar.bcs.NftV1Factory.parse(factory.object.content);
	const ownedNfts = [] as ListNftsResult['ownedNfts'];
	let cursor: string | null | undefined;

	do {
		const page = await client.core.listOwnedObjects({
			owner,
			type: nftType,
			cursor,
			include: { content: true },
		});
		for (const object of page.objects) {
			const nft = client.suigar.bcs.NftV1.parse(object.content);
			ownedNfts.push({
				id: nft.id,
				specId: nft.spec_id,
				name: nft.name,
				description: nft.description,
				url: nft.url.url,
				imageUrl: nft.image_url.url,
			});
		}
		cursor = page.cursor;
	} while (cursor);

	return asTextResponse({
		network: config.network,
		config,
		owner,
		nftType,
		nftCatalog: catalog.specs.contents.map(({ value }) => ({
			id: value.id,
			name: value.name,
			description: value.description,
			url: value.url.url,
			supply: value.supply.toString(),
			available: value.available.toString(),
			price: value.price.toString(),
			priceDisplay: formatBaseUnitAmount(value.price),
		})),
		ownedNfts,
	} satisfies ListNftsResult);
}
