'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WheelFormValues } from '@/lib/suigar-app';

export function WheelForm({
	value,
	onChange,
}: {
	value: WheelFormValues;
	onChange: (patch: Partial<WheelFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="wheelConfigId">Wheel config ID</Label>
				<Input
					id="wheelConfigId"
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
