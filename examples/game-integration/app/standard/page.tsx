'use client';

import dynamic from 'next/dynamic';

const StandardPageContent = dynamic(
	() =>
		import('@/components/integration-shell').then(
			(mod) => mod.StandardIntegrationPage,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-screen items-center justify-center">
				<div className="rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
					Loading standard game integration...
				</div>
			</div>
		),
	},
);

export default function StandardPage() {
	return <StandardPageContent />;
}
