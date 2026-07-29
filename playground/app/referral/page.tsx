import type { Metadata } from 'next';
import { ReferralPage } from '@/components/referral-page';

export const metadata: Metadata = {
	title: 'Suigar Referral Playground',
	description: 'Inspect and claim Suigar referral rewards.',
};

export default function ReferralRoute() {
	return <ReferralPage />;
}
