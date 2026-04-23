'use client';

import { Copy, FileCode2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export function CodeSample({ code }: { code: string }) {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(code);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	}

	return (
		<Card className="h-full">
			<CardHeader className="flex-row items-start justify-between gap-4">
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
				<Button variant="outline" size="sm" onClick={handleCopy}>
					<Copy className="size-4" />
					{copied ? 'Copied' : 'Copy'}
				</Button>
			</CardHeader>
			<CardContent>
				<div className="max-w-full overflow-x-auto rounded-2xl border border-border/70 bg-[linear-gradient(180deg,rgba(7,14,25,.92),rgba(11,21,37,.98))] p-4 text-sm text-slate-100">
					<pre className="max-w-full whitespace-pre-wrap break-all">
						<code>{code}</code>
					</pre>
				</div>
			</CardContent>
		</Card>
	);
}
