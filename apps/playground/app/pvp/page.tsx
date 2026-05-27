import type { Metadata } from 'next';
import { PvPIntegrationPage } from '@/components/integration-shell';

export const metadata: Metadata = {
	title: 'Suigar PvP GamesPlayground',
	description:
		'Create, join, and inspect Suigar SDK PvP Coinflip transactions in the playground.',
};

export default function PvPPage() {
	return <PvPIntegrationPage />;
}
