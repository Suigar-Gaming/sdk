'use client';

import type * as React from 'react';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
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
	onStakeBlur,
	stakeDescription,
}: {
	value: PvPCoinflipCreateFormValues;
	onChange: (patch: Partial<PvPCoinflipCreateFormValues>) => void;
	onStakeBlur?: () => void;
	stakeDescription?: React.ReactNode;
}) {
	return (
		<div className="space-y-6">
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Field>
					<FieldLabel>Creator side</FieldLabel>
					<Select
						value={value.side}
						onValueChange={(side: PvPCoinflipCreateFormValues['side']) => onChange({ side })}
					>
						<SelectTrigger
							aria-label="Select creator side"
							className="bg-background/55 h-11 rounded-2xl px-4"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="heads">Heads</SelectItem>
							<SelectItem value="tails">Tails</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				<Field className="border-border/70 bg-background/45 h-full rounded-2xl border p-4">
					<div className="flex items-center justify-between gap-3">
						<FieldLabel htmlFor="pvp-private-lobby">Private lobby</FieldLabel>
						<Switch
							id="pvp-private-lobby"
							checked={value.isPrivate}
							onCheckedChange={(checked: boolean) => onChange({ isPrivate: checked })}
						/>
					</div>
					<FieldDescription size="sm">Marks the game as private on-chain</FieldDescription>
				</Field>
			</FieldGroup>
			<SharedGameFields
				value={value}
				onChange={onChange}
				onStakeBlur={onStakeBlur}
				description={stakeDescription}
			/>
		</div>
	);
}
