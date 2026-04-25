'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { WheelFormValues } from '@/lib/suigar-types';

export function WheelForm({
	value,
	onChange,
}: {
	value: WheelFormValues;
	onChange: (patch: Partial<WheelFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="wheelConfigId">Wheel config ID</FieldLabel>
				<Input
					id="wheelConfigId"
					type="number"
					step="1"
					value={value.configId}
					onChange={(event) => onChange({ configId: event.target.value })}
				/>
			</Field>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
