'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Label } from '@/components/ui/label';
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
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label>Creator side</Label>
					<Select
						value={value.side}
						onValueChange={(side) =>
							onChange({ side: side as 'heads' | 'tails' })
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
				</div>
				<div className="flex items-end">
					<div className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/40 px-4 py-3">
						<div>
							<p className="text-sm font-medium">Private lobby</p>
							<p className="text-xs text-muted-foreground">
								Marks the PvP game as private on-chain.
							</p>
						</div>
						<Switch
							checked={value.isPrivate}
							onCheckedChange={(checked) => onChange({ isPrivate: checked })}
						/>
					</div>
				</div>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
