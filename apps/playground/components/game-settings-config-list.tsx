'use client';

import { CoinIcon } from '@/components/coins';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
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
	if (!configOptions.length) {
		return null;
	}

	return (
		<div className="grid gap-2.5 md:grid-cols-3">
			{configOptions.map((option) => {
				const isSelected = activeConfigId === option.id;

				return (
					<Accordion
						key={option.id}
						type="single"
						collapsible
						className="rounded-xl border border-border/70 bg-background/40 p-3 text-left"
					>
						<AccordionItem value={option.id} className="border-b-0">
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
										className="uppercase"
									>
										{option.isPlayable ? 'Playable' : 'Disabled'}
									</Badge>
									<AccordionTrigger className="flex h-8 w-8 flex-none items-center justify-center rounded-full border border-border/70 hover:bg-foreground/10 cursor-pointer **:data-[slot=accordion-trigger-icon]:ml-0">
										<span className="sr-only">
											Toggle {option.label} details
										</span>
									</AccordionTrigger>
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

							<AccordionContent className="mt-3 border-t border-border/60 pt-3 pb-0">
								{option.multiplierValues?.length ? (
									<>
										<div className="text-sm font-medium text-muted-foreground mb-2">
											Multipliers:{' '}
											<FieldCode>{option.multiplierValues.length}</FieldCode>
										</div>
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
									</>
								) : (
									<p className="text-xs text-muted-foreground">
										No additional per-config details are available for this
										entry.
									</p>
								)}
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				);
			})}
		</div>
	);
}
