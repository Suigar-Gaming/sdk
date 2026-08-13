'use client';

import { DAppKitProvider } from '@mysten/dapp-kit-react';
import { EventLogProvider } from '@/components/providers/event-log-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { Toaster } from '@/components/ui/sonner';
import { dAppKit } from '@/lib/dapp-kit';

export function AppProviders({ children }: { children: React.ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<DAppKitProvider dAppKit={dAppKit}>
				<EventLogProvider>{children}</EventLogProvider>
			</DAppKitProvider>
			<Toaster richColors />
		</ThemeProvider>
	);
}
