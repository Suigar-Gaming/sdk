'use client';

import { ListTree, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEventLog } from '@/components/providers/event-log-provider';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { compactAddress } from '@/lib/suigar-app';

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
			title={`Copy full ${label}`}
			aria-label={`Copy full ${label}`}
		>
			{compactAddress(value)}
		</button>
	);
}

export function EventsTable() {
	const { rows, clearRows } = useEventLog();

	function handleCopied(label: string) {
		toast.success('Copied to clipboard', {
			description: `Full ${label} copied.`,
		});
	}

	return (
		<Card className="border-border/70 bg-card/80 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader className="flex-row items-start justify-between gap-4">
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
				<Button variant="outline" size="sm" onClick={clearRows}>
					<Trash2 className="size-4" />
					Clear
				</Button>
			</CardHeader>
			<CardContent className="min-h-[12rem]">
				<div className="overflow-hidden rounded-2xl border border-border/70">
					<div className="max-h-[28rem] overflow-auto">
						<table className="w-full min-w-[44rem] text-sm md:min-w-full">
							<thead className="bg-muted/50 text-left text-muted-foreground">
								<tr>
									<th className="px-4 py-3 font-medium">Type</th>
									<th className="px-4 py-3 font-medium">Date</th>
									<th className="px-4 py-3 font-medium">Digest</th>
									<th className="px-4 py-3 font-medium">Game ID</th>
									<th className="px-4 py-3 font-medium">Player</th>
									<th className="px-4 py-3 font-medium">Details</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 ? (
									<tr>
										<td
											colSpan={6}
											className="px-4 py-10 text-center text-muted-foreground"
										>
											Execute a transaction to start filling the shared event
											log.
										</td>
									</tr>
								) : (
									rows.map((row) => (
										<tr
											key={row.id}
											className="border-t border-border/70 align-top"
										>
											<td className="px-4 py-3 font-medium">{row.eventType}</td>
											<td className="px-4 py-3 text-muted-foreground">
												{new Date(row.timestamp).toLocaleString()}
											</td>
											<td className="px-4 py-3 text-xs">
												<CopyableValue
													label="digest"
													value={row.digest}
													onCopied={handleCopied}
												/>
											</td>
											<td className="px-4 py-3 text-xs">
												<CopyableValue
													label="game id"
													value={row.gameId}
													onCopied={handleCopied}
												/>
											</td>
											<td className="px-4 py-3 text-xs text-muted-foreground">
												<CopyableValue
													label="player"
													value={row.actor}
													onCopied={handleCopied}
												/>
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												<ul className="list-disc space-y-1 pl-4">
													{row.details.split(' | ').map((detail) => (
														<li key={detail}>{detail}</li>
													))}
												</ul>
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
