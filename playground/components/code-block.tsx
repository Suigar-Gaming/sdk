'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

export function CodeBlock({
	code,
	copyDescription,
	copyMode = 'icon',
	copyTitle = 'Copy code',
}: {
	code: string;
	copyDescription: string;
	copyMode?: 'button' | 'icon' | 'none';
	copyTitle?: string;
}) {
	async function handleCopy() {
		try {
			await navigator.clipboard.writeText(code);
			toast.success('Copied to clipboard', {
				description: copyDescription,
			});
		} catch {
			toast.error('Unable to copy to clipboard', {
				description: `Could not copy ${copyTitle.toLowerCase()}.`,
			});
		}
	}

	return (
		<div className="border-border/70 relative rounded-2xl border bg-[linear-gradient(180deg,rgba(7,14,25,.92),rgba(11,21,37,.98))] p-4 pr-14 text-slate-100">
			{copyMode !== 'none' ? (
				<div className="absolute top-4 right-4">
					{copyMode === 'icon' ? (
						<Button
							type="button"
							variant="outline"
							size="icon-sm"
							className="size-7 rounded-full border-white/12 bg-white/6 text-slate-300 hover:bg-white/10 hover:text-white"
							onClick={handleCopy}
							title={copyTitle}
							aria-label={copyTitle}
						>
							<Copy className="size-3.5" />
						</Button>
					) : (
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="border-white/12 bg-white/6 text-slate-200 hover:bg-white/10 hover:text-white"
							onClick={handleCopy}
						>
							<Copy className="size-4" />
							Copy
						</Button>
					)}
				</div>
			) : null}
			<pre className="max-w-full font-mono text-sm leading-6 break-all whitespace-pre-wrap text-slate-100">
				<code>{code}</code>
			</pre>
		</div>
	);
}
