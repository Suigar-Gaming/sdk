'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldCode } from '@/components/ui/field';
import type { GameConfigOption } from '@/lib/suigar-types';

export function GameSettingsConfigList({
	configOptions,
}: {
	configOptions: GameConfigOption[];
}) {
	const [expandedConfigIds, setExpandedConfigIds] = React.useState<string[]>(
		[],
	);

	if (!configOptions.length) {
		return null;
	}

	function toggleExpanded(configId: string) {
		setExpandedConfigIds((current) =>
			current.includes(configId)
				? current.filter((id) => id !== configId)
				: [...current, configId],
		);
	}

	return (
		<div className="grid gap-2.5 md:grid-cols-3">
			{configOptions.map((option) => {
				const isExpanded = expandedConfigIds.includes(option.id);

				return (
					<div
						key={option.id}
						className="rounded-xl border border-border/70 bg-background/40 p-3 text-left"
					>
						<div className="flex items-start justify-between gap-3">
							<div className="min-w-0 space-y-1">
								<p className="text-sm font-medium text-foreground">
									{option.label}
								</p>
								<p className="text-xs text-muted-foreground">
									{option.description}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={option.isPlayable ? 'success' : 'destructive'}
									className="px-3 py-1 text-[0.68rem] uppercase"
								>
									{option.isPlayable ? 'Playable' : 'Disabled'}
								</Badge>
								<Button
									type="button"
									variant="outline"
									size="icon-sm"
									className="h-8 w-8 rounded-full text-muted-foreground"
									onClick={() => toggleExpanded(option.id)}
									aria-expanded={isExpanded}
									aria-label={
										isExpanded
											? `Collapse ${option.label} details`
											: `Expand ${option.label} details`
									}
									title={
										isExpanded
											? `Collapse ${option.label} details`
											: `Expand ${option.label} details`
									}
								>
									<ChevronDown
										className={`size-4 shrink-0 transition-transform ${
											isExpanded ? 'rotate-180' : ''
										}`}
									/>
								</Button>
							</div>
						</div>

						{option.details?.length ? (
							<div className="mt-2.5 flex flex-wrap gap-1.5">
								{option.details.map((detail) => (
									<div
										key={`${option.id}-${detail.label}`}
										className="rounded-lg border border-border/70 bg-background/55 px-2.5 py-1.5 text-[0.72rem] text-muted-foreground"
									>
										<span>{detail.label}: </span>
										<FieldCode>{detail.value}</FieldCode>
									</div>
								))}
							</div>
						) : null}

						<p className="mt-2.5 text-xs text-muted-foreground">
							Stake range: <FieldCode>{option.stakeRange.min}</FieldCode> to{' '}
							<FieldCode>{option.stakeRange.max}</FieldCode>
						</p>

						{isExpanded ? (
							<div className="mt-3 space-y-2 border-t border-border/60 pt-3">
								{option.multiplierValues?.length ? (
									<div className="space-y-2">
										<p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
											Parsed multipliers
										</p>
										<div className="flex flex-wrap gap-1.5">
											{option.multiplierValues.map((value, index) => (
												<FieldCode key={`${option.id}-multiplier-${index}`}>
													{value}
												</FieldCode>
											))}
										</div>
									</div>
								) : (
									<p className="text-xs text-muted-foreground">
										No additional per-config details are available for this
										entry.
									</p>
								)}
							</div>
						) : null}
					</div>
				);
			})}
		</div>
	);
}
