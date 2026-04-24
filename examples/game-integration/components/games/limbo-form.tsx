'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { LimboFormValues } from '@/lib/suigar-types';

export function LimboForm({
	value,
	onChange,
}: {
	value: LimboFormValues;
	onChange: (patch: Partial<LimboFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="targetMultiplier">Target multiplier</Label>
					<Input
						id="targetMultiplier"
						type="number"
						step="any"
						value={value.targetMultiplier}
						onChange={(event) =>
							onChange({ targetMultiplier: event.target.value })
						}
					/>
				</div>
				<div className="space-y-2">
					<Label htmlFor="limboScale">Scale (optional)</Label>
					<Input
						id="limboScale"
						type="number"
						step="1"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
				</div>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
