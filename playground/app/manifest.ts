import type { MetadataRoute } from 'next';
import { withBasePath } from '@/lib/paths';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: 'Suigar Game Playground',
		short_name: 'Suigar Games',
		description:
			'Interactive Next.js example showing standard and PvP Coinflip Suigar SDK transactions with dApp Kit.',
		start_url: '/',
		display: 'standalone',
		background_color: '#e4faff',
		theme_color: '#c8f1fb',
		icons: [
			{
				src: withBasePath('/favicon/favicon-16x16.png'),
				sizes: '16x16',
				type: 'image/png',
			},
			{
				src: withBasePath('/favicon/favicon-32x32.png'),
				sizes: '32x32',
				type: 'image/png',
			},
			{
				src: withBasePath('/favicon/favicon.ico'),
				sizes: 'any',
				type: 'image/x-icon',
			},
		],
	};
}
