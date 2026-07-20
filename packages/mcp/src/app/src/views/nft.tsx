// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord, dynamicEntries } from '../lib/format.js';

export function NftView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const config = asRecord(result.config);
	const catalog = Array.isArray(result.nftCatalog) ? result.nftCatalog : [];
	const ownedNfts = Array.isArray(result.ownedNfts) ? result.ownedNfts : [];

	return (
		<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
			<Panel title="Context">
				<DefinitionList
					entries={[
						['Network', result.network],
						['Owner', result.owner],
						['NFT type', result.nftType],
					]}
				/>
			</Panel>
			<Panel title="SDK configuration">
				<DefinitionList entries={dynamicEntries(asRecord(config.sdk))} />
			</Panel>
			<Panel hidden={catalog.length === 0} title="NFT catalog">
				<DefinitionList
					entries={catalog.flatMap((item) => {
						const nft = asRecord(item);
						const label = `${String(nft.name)} (${String(nft.id)})`;
						return [
							[label, `${nft.available}/${nft.supply} available`],
							[`${label} price`, nft.price],
						];
					})}
				/>
			</Panel>
			<Panel hidden={ownedNfts.length === 0} title="Owned NFTs">
				<DefinitionList
					entries={ownedNfts.flatMap((item) => {
						const nft = asRecord(item);
						const label = `${String(nft.name)} (${String(nft.id)})`;
						return [
							[label, nft.id],
							[`${label} image`, nft.imageUrl],
						];
					})}
				/>
			</Panel>
		</section>
	);
}
