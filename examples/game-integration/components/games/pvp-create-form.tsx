'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import {
	Field,
	FieldDescription,
	FieldGroup,
	FieldTitle,
	FieldLabel,
} from '@/components/ui/field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { PvPCreateFormValues } from '@/lib/suigar-types';

export function PvPCreateForm({
	value,
	onChange,
}: {
	value: PvPCreateFormValues;
	onChange: (patch: Partial<PvPCreateFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Field>
					<FieldLabel>Creator side</FieldLabel>
					<Select
						value={value.side}
						onValueChange={(side) =>
							onChange({ side: side as PvPCreateFormValues['side'] })
						}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="heads">Heads</SelectItem>
							<SelectItem value="tails">Tails</SelectItem>
						</SelectContent>
					</Select>
				</Field>
				<Field className="h-full rounded-xl border border-border/70 bg-background/40 px-4 py-3">
					<div className="flex items-center justify-between gap-3">
						<FieldTitle>Private lobby</FieldTitle>
						<Switch
							checked={value.isPrivate}
							onCheckedChange={(checked) => onChange({ isPrivate: checked })}
						/>
					</div>
					<FieldDescription>
						Marks the game as private on-chain.
					</FieldDescription>
				</Field>
			</FieldGroup>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
