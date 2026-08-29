'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	return (
		<html lang="en" data-scroll-behavior="smooth">
			<body className="bg-background text-foreground min-h-dvh">
				<main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-6 py-16">
					<section className="border-border/70 bg-card/90 w-full rounded-3xl border p-8 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl">
						<div className="flex items-start gap-4">
							<div className="bg-destructive/10 text-destructive rounded-2xl p-3">
								<AlertTriangle className="size-6" />
							</div>
							<div className="min-w-0 flex-1 space-y-4">
								<div className="space-y-2">
									<h1 className="text-2xl font-semibold">Something went wrong</h1>
									<p className="text-muted-foreground text-sm leading-6">
										An unexpected error interrupted the playground. Try reloading this part of the
										app, and if the problem persists, check the browser console or server logs for
										the full stack trace.
									</p>
								</div>

								<div className="border-border/60 bg-background/60 rounded-2xl border p-4">
									<p className="text-muted-foreground font-mono text-xs wrap-break-word">
										{error.digest
											? `Error reference: ${error.digest}`
											: error.message || 'Unknown error'}
									</p>
								</div>

								<Button type="button" onClick={reset} className="rounded-full">
									<RotateCcw className="size-4" />
									Try again
								</Button>
							</div>
						</div>
					</section>
				</main>
			</body>
		</html>
	);
}
