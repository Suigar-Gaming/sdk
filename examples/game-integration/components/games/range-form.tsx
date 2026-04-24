'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { RangeFormValues } from '@/lib/suigar-types';

export function RangeForm({
	value,
	onChange,
}: {
	value: RangeFormValues;
	onChange: (patch: Partial<RangeFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="leftPoint">Left point</Label>
					<Input
						id="leftPoint"
						type="number"
						step="any"
						value={value.leftPoint}
						onChange={(event) => onChange({ leftPoint: event.target.value })}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="rightPoint">Right point</Label>
					<Input
						id="rightPoint"
						type="number"
						step="any"
						value={value.rightPoint}
						onChange={(event) => onChange({ rightPoint: event.target.value })}
					/>
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="rangeScale">Scale (optional)</Label>
					<Input
						id="rangeScale"
						type="number"
						step="1"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
				</div>
				<div className="flex items-end">
					<div className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/40 px-4 py-3">
						<div>
							<p className="text-sm font-medium">Out of range</p>
							<p className="text-xs text-muted-foreground">
								Flip the win condition outside the interval.
							</p>
						</div>
						<Switch
							checked={value.outOfRange}
							onCheckedChange={(checked) => onChange({ outOfRange: checked })}
						/>
					</div>
				</div>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
