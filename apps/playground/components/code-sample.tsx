'use client';

import { Copy, FileCode2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export function CodeSample({ code }: { code: string }) {
	async function handleCopy() {
		await navigator.clipboard.writeText(code);
		toast.success('Copied to clipboard', {
			description: 'The transaction block code was copied.',
		});
	}

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
				<CardAction>
					<Button variant="outline" size="sm" onClick={handleCopy}>
						<Copy className="size-4" />
						Copy
					</Button>
				</CardAction>
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
