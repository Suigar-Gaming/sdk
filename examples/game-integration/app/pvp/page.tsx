'use client';

import dynamic from 'next/dynamic';
import { PageLoadingProgress } from '@/components/page-loading-progress';

const PvPPageContent = dynamic(
	() =>
		import('@/components/integration-shell').then(
			(mod) => mod.PvPIntegrationPage,
		),
	{
		ssr: false,
		loading: () => (
			<PageLoadingProgress label="Loading PvP game integration..." />
		),
	},
);

export default function PvPPage() {
	return <PvPPageContent />;
}
