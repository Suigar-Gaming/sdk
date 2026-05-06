'use client';

import type * as React from 'react';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PvPCoinflipCreateFormValues } from '@/lib/suigar-types';

export function PvPCoinflipCreateForm({
	value,
	onChange,
	stakeDescription,
}: {
	value: PvPCoinflipCreateFormValues;
	onChange: (patch: Partial<PvPCoinflipCreateFormValues>) => void;
	stakeDescription?: React.ReactNode;
}) {
	return (
		<div className="space-y-6">
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Field>
					<FieldLabel>Creator side</FieldLabel>
					<Select
						value={value.side}
						onValueChange={(side) =>
							onChange({ side: side as PvPCoinflipCreateFormValues['side'] })
						}
					>
						<SelectTrigger className="h-11 rounded-2xl bg-background/55 px-4">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="heads">Heads</SelectItem>
							<SelectItem value="tails">Tails</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				<Field className="h-full rounded-2xl border border-border/70 bg-background/45 px-4 py-4">
					<div className="flex items-center justify-between gap-3">
						<FieldTitle>Private lobby</FieldTitle>
						<Switch
							checked={value.isPrivate}
							onCheckedChange={(checked) => onChange({ isPrivate: checked })}
						/>
					</div>
					<FieldDescription size="sm">
						Marks the game as private on-chain.
					</FieldDescription>
				</Field>
			</FieldGroup>
			<SharedGameFields
				value={value}
				onChange={onChange}
				description={stakeDescription}
			/>
		</div>
	);
}
