'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function subscribe() {
	return () => {};
}

export function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const mounted = React.useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);

	const isDark = resolvedTheme !== 'light';

	return (
		<Button
			variant="outline"
			size="icon"
			type="button"
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			aria-label="Toggle theme"
			disabled={!mounted}
			className={cn(
				'border-border/70 bg-card/70 rounded-full backdrop-blur-sm',
				className,
			)}
		>
			{mounted ? (
				isDark ? (
					<SunMedium className="size-4" />
				) : (
					<Moon className="size-4" />
				)
			) : (
				<Skeleton aria-hidden="true" className="size-4 rounded-full" />
			)}
		</Button>
	);
}
