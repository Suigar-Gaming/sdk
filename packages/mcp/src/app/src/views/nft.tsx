// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { useState } from 'react';
import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord, shortId } from '../lib/format.js';

function NftTable({
	children,
	headers,
}: {
	children: ReactNode;
	headers: string[];
}) {
	return (
		<div className="overflow-x-auto rounded-md border border-border/70">
			<table className="min-w-full border-collapse text-left text-xs leading-5">
				<thead className="bg-background/75 text-muted-foreground">
					<tr>
						{headers.map((header) => (
							<th className="px-3 py-2 font-extrabold" key={header} scope="col">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-border/70">{children}</tbody>
			</table>
		</div>
	);
}

const isHttpUrl = (value: string) => {
	try {
		const url = new URL(value);
		return url.protocol === 'https:';
	} catch {
		return false;
	}
};

function NftImage({ name, url }: { name: string; url: unknown }) {
	const imageUrl = typeof url === 'string' ? url : '';
	const [failed, setFailed] = useState(!isHttpUrl(imageUrl));

	if (failed) {
		return (
			<span
				className="block max-w-48 truncate font-mono text-muted-foreground"
				title={imageUrl}
			>
				{imageUrl || 'No image URL'}
			</span>
		);
	}

	return (
		<img
			alt={`${name} NFT`}
			className="size-14 rounded-md border border-border/70 bg-background object-cover"
			height={56}
			loading="lazy"
			onError={() => setFailed(true)}
			src={imageUrl}
			width={56}
		/>
	);
}

export function NftView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
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
			<Panel
				className="md:col-span-2"
				hidden={catalog.length === 0}
				title="NFT catalog"
			>
				<NftTable
					headers={['Image', 'NFT', 'Available', 'Supply', 'Price (SUI)']}
				>
					{catalog.map((item) => {
						const nft = asRecord(item);
						return (
							<tr className="bg-card/45" key={String(nft.id)}>
								<td className="px-3 py-2">
									<NftImage name={String(nft.name)} url={nft.url} />
								</td>
								<td className="px-3 py-2 font-bold">
									<div>{String(nft.name)}</div>
									<div
										className="font-mono text-muted-foreground"
										title={String(nft.id)}
									>
										{shortId(nft.id)}
									</div>
								</td>
								<td className="px-3 py-2 font-mono">{String(nft.available)}</td>
								<td className="px-3 py-2 font-mono">{String(nft.supply)}</td>
								<td
									className="px-3 py-2 font-mono"
									title={`${String(nft.price)} MIST`}
								>
									{String(nft.priceDisplay ?? nft.price)}
								</td>
							</tr>
						);
					})}
				</NftTable>
			</Panel>
			<Panel className="md:col-span-2" title="Owned NFTs">
				{ownedNfts.length === 0 ? (
					<p className="text-xs font-semibold text-muted-foreground">
						This address does not own any legacy Suigar NFTs.
					</p>
				) : (
					<NftTable headers={['Image', 'NFT', 'Object ID', 'Spec ID']}>
						{ownedNfts.map((item) => {
							const nft = asRecord(item);
							return (
								<tr className="bg-card/45" key={String(nft.id)}>
									<td className="px-3 py-2">
										<NftImage name={String(nft.name)} url={nft.imageUrl} />
									</td>
									<td className="px-3 py-2 font-bold">{String(nft.name)}</td>
									<td className="px-3 py-2 font-mono" title={String(nft.id)}>
										{shortId(nft.id)}
									</td>
									<td
										className="px-3 py-2 font-mono"
										title={String(nft.specId)}
									>
										{shortId(nft.specId)}
									</td>
								</tr>
							);
						})}
					</NftTable>
				)}
			</Panel>
		</section>
	);
}
