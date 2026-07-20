import type { Metadata } from 'next';
import { NftPage } from '@/components/nft-page';

export const metadata: Metadata = {
	title: 'Suigar NFT Playground',
	description: 'Inspect the Suigar NFT collection and wallet ownership.',
};

export default function NftRoute() {
	return <NftPage />;
}
