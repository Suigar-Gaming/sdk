'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PlinkoFormValues } from '@/lib/suigar-app';

export function PlinkoForm({
	value,
	onChange,
}: {
	value: PlinkoFormValues;
	onChange: (patch: Partial<PlinkoFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="plinkoConfigId">Board config ID</Label>
				<Input
					id="plinkoConfigId"
					type="number"
					step="1"
					value={value.configId}
					onChange={(event) => onChange({ configId: event.target.value })}
				/>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
