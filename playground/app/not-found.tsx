import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { withBasePath } from '@/lib/paths';

const homeHref = withBasePath('/');

export default function NotFound() {
	return (
		<main className="flex min-h-dvh items-center justify-center px-6 py-16">
			<Card className="w-full max-w-lg bg-card/85 shadow-[0_32px_90px_-44px_rgba(8,47,91,0.48)]">
				<CardHeader className="gap-2 pb-4">
					<div className="space-y-2 text-center">
						<CardTitle className="font-serif text-4xl tracking-normal sm:text-5xl text-foreground">
							Page not found
						</CardTitle>
						<CardDescription className="max-w-md text-base leading-7 text-muted-foreground">
							This page is not available in the playground. Return to the main flow to keep
							exploring the SDK.
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="flex justify-center pt-0">
					<Button asChild size="lg" className="px-6 rounded-full">
						<Link href={homeHref}>Take me home</Link>
					</Button>
				</CardContent>
			</Card>
		</main>
	);
}
