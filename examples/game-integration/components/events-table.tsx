'use client';

import { ListTree, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEventLog } from '@/components/providers/event-log-provider';
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
import { compactAddress } from '@/lib/suigar-app';

function toTitleCase(value: string) {
	return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function CopyableValue({
	label,
	value,
	onCopied,
}: {
	label: string;
	value?: string;
	onCopied: (label: string) => void;
}) {
	if (!value) {
		return <span>{compactAddress(value)}</span>;
	}

	async function copyValue() {
		await navigator.clipboard.writeText(value!);
		onCopied(label);
	}

	return (
		<button
			type="button"
			className="cursor-pointer font-mono underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
			onClick={copyValue}
			title={`Copy ${label}`}
			aria-label={`Copy ${label}`}
		>
			{compactAddress(value)}
		</button>
	);
}

export function EventsTable() {
	const { rows, clearRows } = useEventLog();

	function handleCopied(label: string) {
		const titleCaseLabel = toTitleCase(label);

		toast.success('Copied to clipboard', {
			description: `${titleCaseLabel} copied.`,
		});
	}

	return (
		<Card className="border-border/70 bg-card/80 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader>
				<div className="space-y-2">
					<CardTitle className="flex items-center gap-2">
						<ListTree className="size-5 text-secondary dark:text-primary" />
						Decoded events
					</CardTitle>
					<CardDescription>
						Event history stays available when you switch games. Clear it
						whenever you want a fresh log.
					</CardDescription>
				</div>
				<CardAction>
					<Button variant="outline" size="sm" onClick={clearRows}>
						<Trash2 className="size-4" />
						Clear
					</Button>
				</CardAction>
			</CardHeader>
			<CardContent className="min-h-[12rem]">
				<div className="overflow-hidden rounded-2xl border border-border/70">
					<div className="max-h-[28rem] overflow-auto">
						<Table className="min-w-[44rem] bg-background md:min-w-full">
							<TableHeader className="bg-accent">
								<TableRow className="hover:bg-transparent">
									<TableHead className="sticky top-0 z-10 bg-accent">
										Type
									</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">
										Date
									</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">
										Digest
									</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">
										Game ID
									</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">
										Player
									</TableHead>
									<TableHead className="sticky top-0 z-10 bg-accent">
										Details
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.length === 0 ? (
									<TableRow>
										<TableCell
											colSpan={6}
											className="py-10 text-center text-muted-foreground"
										>
											Execute a transaction to start filling the shared event
											log.
										</TableCell>
									</TableRow>
								) : (
									rows.map((row) => (
										<TableRow
											key={row.id}
											className="align-top odd:bg-accent/35 even:bg-card/55"
										>
											<TableCell className="font-medium">
												{row.eventType}
											</TableCell>
											<TableCell className="text-muted-foreground">
												{new Date(row.timestamp).toLocaleString()}
											</TableCell>
											<TableCell className="text-xs">
												<CopyableValue
													label="digest"
													value={row.digest}
													onCopied={handleCopied}
												/>
											</TableCell>
											<TableCell className="text-xs">
												<CopyableValue
													label="game id"
													value={row.gameId}
													onCopied={handleCopied}
												/>
											</TableCell>
											<TableCell className="text-xs text-muted-foreground">
												<CopyableValue
													label="player"
													value={row.actor}
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
