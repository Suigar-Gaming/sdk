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
		<html lang="en">
			<body className="min-h-dvh bg-background text-foreground">
				<main className="mx-auto flex min-h-dvh w-full max-w-3xl items-center px-6 py-16">
					<section className="w-full rounded-3xl border border-border/70 bg-card/90 p-8 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl">
						<div className="flex items-start gap-4">
							<div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
								<AlertTriangle className="size-6" />
							</div>
							<div className="min-w-0 flex-1 space-y-4">
								<div className="space-y-2">
									<h1 className="text-2xl font-semibold">Something went wrong</h1>
									<p className="text-sm leading-6 text-muted-foreground">
										An unexpected error interrupted the playground. Try reloading this part of the
										app, and if the problem persists, check the browser console or server logs for
										the full stack trace.
									</p>
								</div>

								<div className="rounded-2xl border border-border/60 bg-background/60 p-4">
									<p className="font-mono text-xs wrap-break-word text-muted-foreground">
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
