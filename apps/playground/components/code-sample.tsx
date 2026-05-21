'use client';

import { FileCode2 } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CodeSample({ code }: { code: string }) {
	return (
		<Card className="h-full">
			<CardHeader>
				<div className="space-y-2">
					<CardTitle className="flex items-center gap-2">
						<FileCode2 className="size-5 text-secondary dark:text-primary" />
						Transaction code
					</CardTitle>
					<CardDescription>
						The code block updates live from the current form state and matches
						the builder call executed by the wallet.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<CodeBlock
					code={code}
					copyDescription="The transaction block code was copied."
					copyMode="icon"
					copyTitle="Copy transaction code"
				/>
			</CardContent>
		</Card>
	);
}

export function CodeSampleSkeleton() {
	return (
		<Card className="h-full">
			<CardHeader>
				<div className="space-y-2">
					<CardTitle className="flex items-center gap-2">
						<FileCode2 className="size-5 text-secondary dark:text-primary" />
						Transaction code
					</CardTitle>
					<CardDescription>
						The code block updates live from the current form state and matches
						the builder call executed by the wallet.
					</CardDescription>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(7,14,25,.92),rgba(11,21,37,.98))] p-4">
					<Skeleton className="h-4 w-[92%] bg-white/10" />
					<Skeleton className="h-4 w-[86%] bg-white/10" />
					<Skeleton className="h-4 w-[78%] bg-white/10" />
					<Skeleton className="h-4 w-[88%] bg-white/10" />
					<Skeleton className="h-4 w-[64%] bg-white/10" />
					<Skeleton className="h-4 w-[72%] bg-white/10" />
				</div>
			</CardContent>
		</Card>
	);
}
