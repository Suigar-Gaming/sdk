'use client';

import dynamic from 'next/dynamic';

const PvPPageContent = dynamic(
	() =>
		import('@/components/integration-shell').then(
			(mod) => mod.PvPIntegrationPage,
		),
	{
		ssr: false,
		loading: () => (
			<div className="flex min-h-screen items-center justify-center">
				<div className="rounded-full border border-border/60 bg-card/80 px-4 py-2 text-sm text-muted-foreground backdrop-blur">
					Loading PvP game integration...
				</div>
			</div>
		),
	},
);

export default function PvPPage() {
	return <PvPPageContent />;
}
