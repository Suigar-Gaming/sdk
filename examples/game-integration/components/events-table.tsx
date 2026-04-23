'use client';

import { Trash2 } from 'lucide-react';
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

export function EventsTable() {
	const { rows, clearRows } = useEventLog();

	return (
		<Card className="border-border/70 bg-card/80 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader className="flex-row items-start justify-between gap-4">
				<div className="space-y-2">
					<CardTitle>Decoded events</CardTitle>
					<CardDescription>
						Event history is shared across game switches and route changes until
						you clear it.
					</CardDescription>
				</div>
				<Button variant="outline" size="sm" onClick={clearRows}>
					<Trash2 className="size-4" />
					Clear
				</Button>
			</CardHeader>
			<CardContent className="min-h-[12rem]">
				<div className="overflow-hidden rounded-2xl border border-border/70">
					<div className="overflow-x-auto">
						<table className="w-full min-w-[44rem] text-sm md:min-w-full">
							<thead className="bg-muted/50 text-left text-muted-foreground">
								<tr>
									<th className="px-4 py-3 font-medium">Type</th>
									<th className="px-4 py-3 font-medium">Date</th>
									<th className="px-4 py-3 font-medium">Digest</th>
									<th className="px-4 py-3 font-medium">Game / actor</th>
									<th className="px-4 py-3 font-medium">Details</th>
								</tr>
							</thead>
							<tbody>
								{rows.length === 0 ? (
									<tr>
										<td
											colSpan={5}
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
											<td className="px-4 py-3 font-mono text-xs">
												{compactAddress(row.digest)}
											</td>
											<td className="px-4 py-3">
												<div className="space-y-1">
													<div className="font-mono text-xs">
														{compactAddress(row.gameId)}
													</div>
													<div className="text-xs text-muted-foreground">
														{compactAddress(row.actor)}
													</div>
												</div>
											</td>
											<td className="px-4 py-3 text-muted-foreground">
												{row.details}
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
