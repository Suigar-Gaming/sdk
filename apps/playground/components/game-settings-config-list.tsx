'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { CoinIcon } from '@/components/coins';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FieldCode } from '@/components/ui/field';
import type { GameConfigOption, SupportedCoinKey } from '@/lib/suigar-types';

export function GameSettingsConfigList({
	activeConfigId,
	coinKey,
	configOptions,
}: {
	activeConfigId?: string | null;
	coinKey: SupportedCoinKey;
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
				const isSelected = activeConfigId === option.id;
				const toggleDetailsLabel = `${
					isExpanded ? 'Collapse' : 'Expand'
				} ${option.label} details`;

				return (
					<div
						key={option.id}
						className="rounded-xl border border-border/70 bg-background/40 p-3 text-left"
					>
						<div className="flex items-center justify-between gap-3">
							<div className="min-w-0 space-y-1">
								<Badge
									variant={isSelected ? 'secondary' : 'ghost'}
									className={`px-2.5 py-1 text-sm ${
										isSelected ? 'font-semibold' : ''
									}`}
								>
									{option.label}
								</Badge>
								{option.description ? (
									<p className="text-xs text-muted-foreground">
										{option.description}
									</p>
								) : null}
							</div>
							<div className="flex items-center gap-2">
								<Badge
									variant={option.isPlayable ? 'success' : 'destructive'}
									className="py-1 uppercase"
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
									aria-label={toggleDetailsLabel}
									title={toggleDetailsLabel}
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
							<div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
								{option.details.map((detail) => (
									<div
										key={`${option.id}-${detail.label}`}
										className="shrink-0"
									>
										<span>{detail.label}: </span>
										<FieldCode>{detail.value}</FieldCode>
									</div>
								))}
							</div>
						) : null}

						<div className="mt-2.5 flex flex-nowrap items-center gap-2 overflow-x-auto text-sm text-muted-foreground">
							<span className="shrink-0">Stake range:</span>
							<FieldCode className="shrink-0">
								{option.stakeRange.min}
							</FieldCode>
							<span className="shrink-0">to</span>
							<FieldCode className="shrink-0">
								{option.stakeRange.max}
							</FieldCode>
							<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap uppercase tracking-[0.12em]">
								<CoinIcon coinKey={coinKey} className="size-4" />
								{coinKey.toUpperCase()}
							</span>
						</div>

						{isExpanded ? (
							<div className="mt-3 space-y-2 border-t border-border/60 pt-3">
								{option.multiplierValues?.length ? (
									<div className="space-y-2">
										<p className="text-sm font-medium text-muted-foreground">
											Multipliers:{' '}
											<FieldCode>{option.multiplierValues.length}</FieldCode>
										</p>
										<div className="flex flex-wrap gap-1.5">
											{option.multiplierValues.map((value, index) => (
												<FieldCode
													key={`${option.id}-multiplier-${index}`}
													className="shrink-0"
												>
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
