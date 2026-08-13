import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
	title: 'Suigar SDK Playground',
	description: 'Build, inspect, and execute Suigar SDK standard and PvP transactions.',
};

export default function HomePage() {
	redirect('/standard?game=coinflip');
}
