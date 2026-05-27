import type { Metadata } from 'next';
import { StandardIntegrationPage } from '@/components/integration-shell';

export const metadata: Metadata = {
	title: 'Suigar Standard Games Playground',
	description:
		'Build and inspect standard Suigar SDK game transactions in the playground.',
};

export default function StandardPage() {
	return <StandardIntegrationPage />;
}
