'use client';

import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { dAppKit } from '@/lib/dapp-kit';
import { EventLogProvider } from '@/components/providers/event-log-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<DAppKitProvider dAppKit={dAppKit}>
				<EventLogProvider>{children}</EventLogProvider>
			</DAppKitProvider>
		</ThemeProvider>
	);
}
