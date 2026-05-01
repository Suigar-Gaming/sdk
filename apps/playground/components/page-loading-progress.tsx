'use client';

import * as React from 'react';
import { Progress } from '@/components/ui/progress';

export function PageLoadingProgress({ label }: { label: string }) {
	const [value, setValue] = React.useState(18);

	React.useEffect(() => {
		const interval = window.setInterval(() => {
			setValue((current) => (current >= 88 ? 34 : current + 14));
		}, 280);

		return () => window.clearInterval(interval);
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center px-6">
			<div className="w-full max-w-sm space-y-3 rounded-lg border border-border/70 bg-card/85 px-5 py-4 shadow-[0_18px_45px_-36px_rgba(8,47,91,0.5)] backdrop-blur-xl dark:shadow-[0_18px_45px_-36px_rgba(0,0,0,0.72)]">
				<div className="text-sm font-medium text-foreground">{label}</div>
				<Progress value={value} aria-label={label} />
			</div>
		</div>
	);
}
