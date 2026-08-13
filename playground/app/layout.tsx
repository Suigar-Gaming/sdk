import type { Metadata } from 'next';
import { Bagel_Fat_One, IBM_Plex_Mono, Urbanist } from 'next/font/google';
import { AppProviders } from '@/components/providers/app-providers';
import { withBasePath } from '@/lib/paths';
import './globals.css';

const sans = Urbanist({
	subsets: ['latin'],
	variable: '--font-sans',
});

const serif = Bagel_Fat_One({
	subsets: ['latin'],
	variable: '--font-serif',
	weight: '400',
});

const mono = IBM_Plex_Mono({
	subsets: ['latin'],
	variable: '--font-mono',
	weight: ['400', '500'],
});

export const metadata: Metadata = {
	applicationName: 'Suigar SDK Playground',
	title: 'Suigar SDK Playground',
	description:
		'Interactive Next.js example showing standard and PvP Coinflip Suigar SDK transactions with dApp Kit.',
	icons: {
		icon: [
			{
				url: withBasePath('/favicon/favicon-16x16.png'),
				sizes: '16x16',
				type: 'image/png',
			},
			{
				url: withBasePath('/favicon/favicon-32x32.png'),
				sizes: '32x32',
				type: 'image/png',
			},
			{
				url: withBasePath('/favicon/favicon.ico'),
				sizes: 'any',
				type: 'image/x-icon',
			},
		],
		apple: [
			{
				url: withBasePath('/favicon/apple-touch-icon.png'),
				sizes: '180x180',
				type: 'image/png',
			},
		],
		other: [
			{
				rel: 'android-chrome',
				url: withBasePath('/favicon/android-chrome-192x192.png'),
				sizes: '192x192',
				type: 'image/png',
			},
			{
				rel: 'android-chrome',
				url: withBasePath('/favicon/android-chrome-512x512.png'),
				sizes: '512x512',
				type: 'image/png',
			},
		],
	},
	manifest: withBasePath('/manifest.json'),
	appleWebApp: true,
	authors: {
		name: 'Suigar Team',
		url: 'https://github.com/Suigar-Gaming',
	},
	creator: 'Suigar Team',
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${sans.variable} ${serif.variable} ${mono.variable} h-full`}
		>
			<body className="min-h-full antialiased bg-background text-foreground">
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	);
}
