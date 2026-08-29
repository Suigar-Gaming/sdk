'use client';

import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react';
import { Check, FileCode2 } from 'lucide-react';
import Image from 'next/image';
import * as React from 'react';
import type { SuigarClient } from '@suigar/sdk';
import { AppHeader } from '@/components/app-header';
import { CodeBlock } from '@/components/code-block';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type NftSpec = {
	id: string;
	name: string;
	description: string;
	imageUrl: string | undefined;
	available: string | undefined;
	supply: string | undefined;
};

type OwnedNftDisplay = {
	name: string | undefined;
	description: string | undefined;
	imageUrl: string | undefined;
};

function toSafeImageUrl(value: string): string | undefined {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' ? url.href : undefined;
	} catch {
		return undefined;
	}
}

async function getOwnedNftsBySpec(
	client: ReturnType<typeof useCurrentClient> & { suigar: SuigarClient },
	owner: string,
	nftType: string,
): Promise<Map<string, OwnedNftDisplay>> {
	const ownedNftsBySpec = new Map<string, OwnedNftDisplay>();
	let cursor: string | null | undefined;

	do {
		const page = await client.core.listOwnedObjects({
			owner,
			type: nftType,
			include: { content: true },
			limit: 50,
			cursor,
		});
		for (const nft of page.objects) {
			if (nft instanceof Error || !nft.content) continue;
			const parsedNft = client.suigar.bcs.NftV1.parse(nft.content);
			if (ownedNftsBySpec.has(parsedNft.spec_id)) continue;

			ownedNftsBySpec.set(parsedNft.spec_id, {
				name: parsedNft.name,
				description: parsedNft.description,
				imageUrl: toSafeImageUrl(parsedNft.image_url.url),
			});
		}
		cursor = page.cursor;
	} while (cursor);

	return ownedNftsBySpec;
}

export function NftPage() {
	const client = useCurrentClient();
	const account = useCurrentAccount();
	const accountAddress = account?.address;
	const [specs, setSpecs] = React.useState<Array<NftSpec>>([]);
	const [ownedNftsBySpec, setOwnedNftsBySpec] = React.useState<Map<string, OwnedNftDisplay>>(
		new Map(),
	);
	const [error, setError] = React.useState<string | null>(null);
	const [activeRequestId, setActiveRequestId] = React.useState<number | null>(0);
	const requestIdRef = React.useRef(0);
	const isLoading = activeRequestId !== null;
	const nftCode = `const { nftV1: nftPackageId } = client.suigar.getConfig().packageIds;
const { nftV1Factory: nftFactoryId } = client.suigar.getConfig().objectIds;

const { object } = await client.core.getObject({
  objectId: nftFactoryId,
  include: { content: true },
});
const factory = client.suigar.bcs.NftV1Factory.parse(object.content);

const nftType = client.suigar.bcs.NftV1.typeTag({ package: nftPackageId });
const page = await client.core.listOwnedObjects({
  owner: '${accountAddress ?? '<wallet address>'}',
  type: nftType,
  include: { content: true },
});
const ownedNfts = page.objects.map(({ content }) =>
  client.suigar.bcs.NftV1.parse(content),
);`;

	React.useEffect(() => {
		let cancelled = false;
		const requestId = ++requestIdRef.current;
		const { nftV1: nftPackageId } = client.suigar.getConfig().packageIds;
		const { nftV1Factory: nftFactoryId } = client.suigar.getConfig().objectIds;

		async function load() {
			setActiveRequestId(requestId);
			setError(null);
			try {
				const { object } = await client.core.getObject({
					objectId: nftFactoryId,
					include: { content: true },
				});
				if (object instanceof Error) throw object;
				if (!object.content) {
					throw new Error('The NFT factory did not return BCS content.');
				}
				const factory = client.suigar.bcs.NftV1Factory.parse(object.content);
				const nextSpecs = factory.specs.contents.map(({ value }) => ({
					id: value.id,
					name: value.name,
					description: value.description,
					imageUrl: toSafeImageUrl(value.url.url),
					available: value.available.toString(),
					supply: value.supply.toString(),
				}));
				if (nextSpecs.length === 0) {
					throw new Error('The NFT factory did not return any readable specs.');
				}
				const nextOwnedNftsBySpec = accountAddress
					? await getOwnedNftsBySpec(
							client,
							accountAddress,
							client.suigar.bcs.NftV1.typeTag({
								package: nftPackageId,
							}),
						)
					: new Map<string, OwnedNftDisplay>();
				if (!cancelled) {
					setSpecs(nextSpecs);
					setOwnedNftsBySpec(nextOwnedNftsBySpec);
				}
			} catch (loadError) {
				if (!cancelled) {
					setError(loadError instanceof Error ? loadError.message : String(loadError));
				}
			} finally {
				if (!cancelled) {
					setActiveRequestId((activeRequestId) =>
						activeRequestId === requestId ? null : activeRequestId,
					);
				}
			}
		}

		void load();
		return () => {
			cancelled = true;
		};
	}, [accountAddress, client]);

	return (
		<div className="min-h-dvh">
			<div className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5 md:pt-4 lg:px-8">
				<div className="mx-auto max-w-[1500px]">
					<AppHeader />
				</div>
			</div>

			<main className="mx-auto mt-2 w-full max-w-[1500px] px-3 pt-20 pb-8 md:px-5 md:pt-24 lg:px-8">
				<section className="border-border/70 bg-card/80 mb-6 rounded-4xl border p-6 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h1 className="text-2xl leading-none md:text-4xl xl:text-5xl">Suigar NFTs</h1>
							<p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6 md:text-base">
								Browse the configured Suigar NFT collection, inspect live factory supply, and see
								which specs are already held by the connected wallet.
							</p>
						</div>
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="outline">
									<FileCode2 />
									View code
								</Button>
							</DialogTrigger>
							<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" size="xl">
								<DialogHeader>
									<DialogTitle className="text-xl md:text-2xl">NFT lookup code</DialogTitle>
									<DialogDescription>
										This mirrors the factory and ownership lookups used by this page, including the
										SDK BCS decoders.
									</DialogDescription>
								</DialogHeader>
								<CodeBlock
									code={nftCode}
									copyDescription="The NFT lookup code was copied."
									copyTitle="Copy NFT lookup code"
									copyMode="icon"
								/>
							</DialogContent>
						</Dialog>
					</div>
				</section>

				{error ? (
					<Card>
						<CardHeader>
							<CardTitle>Unable to load NFTs</CardTitle>
							<CardDescription>{error}</CardDescription>
						</CardHeader>
					</Card>
				) : null}
				<div className="mx-auto grid max-w-[1000px] gap-4 sm:grid-cols-2 xl:grid-cols-3">
					{isLoading
						? Array.from({ length: 3 }, (_, index) => (
								<Skeleton key={index} className="h-60 rounded-3xl" />
							))
						: specs.map((spec) => {
								const ownedNft = ownedNftsBySpec.get(spec.id);
								const possessed = Boolean(ownedNft);
								const name = ownedNft?.name ?? spec.name;
								const description = ownedNft?.description ?? spec.description;
								const imageUrl = ownedNft?.imageUrl ?? spec.imageUrl;
								return (
									<Card key={spec.id} className="overflow-hidden">
										<CardHeader className="p-4">
											{imageUrl ? (
												<div className="relative mx-auto mb-3 aspect-square w-full max-w-80 overflow-hidden rounded-2xl">
													<Image
														src={imageUrl}
														alt={name}
														fill
														sizes="(min-width: 1280px) 320px, (min-width: 640px) 50vw, 100vw"
														unoptimized
														className="object-contain"
													/>
												</div>
											) : (
												<div className="bg-background/35 mx-auto mb-3 aspect-square w-full max-w-80 rounded-2xl" />
											)}
											<div className="flex w-full items-center justify-between gap-3">
												<CardTitle>{name}</CardTitle>
												{account ? (
													<Badge variant={possessed ? 'success' : 'outline'}>
														{possessed ? (
															<>
																<Check /> Possessed
															</>
														) : (
															'Not possessed'
														)}
													</Badge>
												) : null}
											</div>
											<CardDescription className="mt-2">{description}</CardDescription>
										</CardHeader>
										<CardContent className="space-y-3 p-4 pt-0">
											<div className="text-muted-foreground flex items-center justify-between text-sm">
												<span>Available</span>
												<span className="text-foreground font-medium">
													{spec.available ?? '—'}
													{spec.supply ? ` / ${spec.supply}` : ''}
												</span>
											</div>
										</CardContent>
									</Card>
								);
							})}
				</div>
			</main>
		</div>
	);
}
