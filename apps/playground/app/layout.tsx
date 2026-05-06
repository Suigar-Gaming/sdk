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
	icons: withBasePath('/icon.png'),
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
