'use client';

import { FileCode2 } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const SKELETON_LINE_WIDTHS = ['92%', '86%', '78%', '88%', '64%', '72%'] as const;

function CodeSampleCard({
	children,
	description = 'The code block updates live from the current form state and matches the builder call executed by the wallet.',
	title = 'Transaction code',
}: {
	children: React.ReactNode;
	description?: string;
	title?: string;
}) {
	return (
		<Card className="h-full">
			<CardHeader>
				<div className="space-y-2">
					<CardTitle className="flex items-center gap-2">
						<FileCode2 className="size-5 text-secondary dark:text-primary" />
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

export function CodeSample({
	code,
	copyTitle = 'Copy transaction code',
	description,
	title,
}: {
	code: string;
	copyTitle?: string;
	description?: string;
	title?: string;
}) {
	return (
		<CodeSampleCard description={description} title={title}>
			<CodeBlock
				code={code}
				copyDescription={`${title ?? 'Transaction'} block code was copied.`}
				copyMode="icon"
				copyTitle={copyTitle}
			/>
		</CodeSampleCard>
	);
}

export function CodeSampleSkeleton() {
	return (
		<CodeSampleCard>
			<div className="space-y-3 rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(7,14,25,.92),rgba(11,21,37,.98))] p-4">
				{SKELETON_LINE_WIDTHS.map((width) => (
					<Skeleton key={width} className="h-4 bg-white/10" style={{ width }} />
				))}
			</div>
		</CodeSampleCard>
	);
}
