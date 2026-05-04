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
