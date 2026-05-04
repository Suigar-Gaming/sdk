'use client';

import { Badge } from '@/components/ui/badge';
import { FieldCode } from '@/components/ui/field';
import type { GameConfigOption } from '@/lib/suigar-types';

export function GameSettingsConfigList({
	configOptions,
}: {
	configOptions: GameConfigOption[];
}) {
	if (!configOptions.length) {
		return null;
	}

	return (
		<div className="grid gap-2.5 md:grid-cols-3">
			{configOptions.map((option) => (
				<div
					key={option.id}
					className="rounded-xl border border-border/70 bg-background/40 p-3"
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
						<Badge
							variant={option.isPlayable ? 'success' : 'destructive'}
							className="px-3 py-1 text-[0.68rem]"
						>
							{option.isPlayable ? 'Playable' : 'Disabled'}
						</Badge>
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
				</div>
			))}
		</div>
	);
}
