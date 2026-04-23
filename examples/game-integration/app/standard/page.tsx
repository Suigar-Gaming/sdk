'use client';

import dynamic from 'next/dynamic';
import { PageLoadingProgress } from '@/components/page-loading-progress';

const StandardPageContent = dynamic(
	() =>
		import('@/components/integration-shell').then(
			(mod) => mod.StandardIntegrationPage,
		),
	{
		ssr: false,
		loading: () => (
			<PageLoadingProgress label="Loading standard game integration..." />
		),
	},
);

export default function StandardPage() {
	return <StandardPageContent />;
}
