'use client';

import { Moon, SunMedium } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
	const { resolvedTheme, setTheme } = useTheme();
	const isDark = resolvedTheme !== 'light';

	return (
		<Button
			variant="outline"
			size="icon"
			type="button"
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			aria-label="Toggle theme"
			className={cn(
				'rounded-full border-border/70 bg-card/70 backdrop-blur-sm',
				className,
			)}
		>
			{isDark ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
		</Button>
	);
}
