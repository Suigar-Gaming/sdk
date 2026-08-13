'use client';

import { Copy, ExternalLink, ListTree, Trash2 } from 'lucide-react';
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { useEventLog } from '@/hooks/use-event-log';
import { compactAddress } from '@/lib/suigar-app';

function toTitleCase(value: string) {
	return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

const explorerBaseUrl = 'https://testnet.suivision.xyz';

function toExplorerUrl(path: string, identifier: string, search?: string) {
	const url = new URL(`${path}/${encodeURIComponent(identifier)}`, explorerBaseUrl);
	if (search) {
		url.search = search;
	}
	return url.toString();
}

function toTransactionUrl(digest: string) {
	return toExplorerUrl('/txblock', digest, 'tab=Changes');
}

function toAccountUrl(address: string) {
	return toExplorerUrl('/account', address);
}

const eventTimestampFormatter = new Intl.DateTimeFormat('en-US', {
	day: 'numeric',
	hour: '2-digit',
	minute: '2-digit',
	month: 'short',
	second: '2-digit',
	timeZone: 'UTC',
	timeZoneName: 'short',
	year: 'numeric',
});

function formatEventTimestamp(timestamp: string) {
	return eventTimestampFormatter.format(new Date(timestamp));
}

function handleCopied(label: string) {
	const titleCaseLabel = toTitleCase(label);

	toast.success('Copied to clipboard', {
		description: `${titleCaseLabel} copied.`,
	});
}

function CopyableValue({
	label,
	value,
	explorerHref,
	onCopied,
}: {
	label: string;
	value?: string;
	explorerHref?: string;
	onCopied: (label: string) => void;
}) {
	if (!value) {
		return <span>{compactAddress(value)}</span>;
	}

	const displayValue = value;

	async function copyValue() {
		try {
			await navigator.clipboard.writeText(displayValue);
			onCopied(label);
		} catch {
			toast.error('Unable to copy to clipboard', {
				description: `Could not copy ${label}.`,
			});
		}
	}

	return (
		<div className="flex items-center gap-2">
			<span className="font-mono text-muted-foreground">{compactAddress(displayValue)}</span>
			<Button
				type="button"
				variant="outline"
				size="icon-sm"
				className="size-7 text-muted-foreground rounded-full"
				onClick={copyValue}
				title={`Copy ${label}`}
				aria-label={`Copy ${label}`}
			>
				<Copy className="size-3.5" />
			</Button>
			{explorerHref ? (
				<Button
					asChild
					variant="outline"
					size="icon-sm"
					className="size-7 text-muted-foreground rounded-full"
				>
					<a
						href={explorerHref}
						target="_blank"
						rel="noreferrer"
						title={`Open ${label} in SuiVision`}
						aria-label={`Open ${label} in SuiVision`}
					>
						<ExternalLink className="size-3.5" />
					</a>
				</Button>
			) : null}
		</div>
	);
}

export function EventsTable() {
	const { rows, clearRows } = useEventLog();

	return (
		<Card className="shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader className="relative">
				<div className="space-y-2">
					<CardTitle className="flex items-center gap-2">
						<ListTree className="size-5 text-secondary dark:text-primary" />
						Decoded events
					</CardTitle>
					<CardDescription>
						Event history stays available when you switch games. Clear it whenever you want a fresh
						log.
					</CardDescription>
				</div>
				<CardAction className="absolute top-6 right-6">
					<Button variant="destructive" size="sm" onClick={clearRows}>
						<Trash2 className="size-4" />
						Clear
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="min-h-[12rem]">
				<div className="overflow-hidden border-border/70 rounded-2xl border">
					<div className="max-h-[28rem] overflow-auto">
						<Table className="min-w-[44rem] md:min-w-full bg-background">
							<TableHeader className="bg-accent">
								<TableRow className="hover:bg-transparent">
									<TableHead className="sticky top-0 z-10 bg-accent">Type</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">Date</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">Digest</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">Game ID</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">Player</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.length === 0 ? (
									<TableRow>
										<TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
											Execute a transaction to start filling the shared event log.
										</TableCell>
									</TableRow>
								) : (
									rows.map((row) => (
										<TableRow key={row.id} className="align-top odd:bg-accent/35 even:bg-card/55">
											<TableCell className="font-medium">{row.eventType}</TableCell>
											<TableCell className="text-muted-foreground">
												{formatEventTimestamp(row.timestamp)}
											</TableCell>
											<TableCell className="text-xs">
												<CopyableValue
													label="digest"
													value={row.digest}
													explorerHref={toTransactionUrl(row.digest)}
													onCopied={handleCopied}
												/>
											</TableCell>
											<TableCell className="text-xs">
												<CopyableValue label="game id" value={row.gameId} onCopied={handleCopied} />
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												<CopyableValue
													label="player"
													value={row.actor}
													explorerHref={row.actor ? toAccountUrl(row.actor) : undefined}
													onCopied={handleCopied}
												/>
											</TableCell>
											<TableCell className="text-muted-foreground">
												<ul className="list-disc space-y-1 pl-4">
													{row.details.split(' | ').map((detail) => (
														<li key={detail}>{detail}</li>
													))}
												</ul>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
