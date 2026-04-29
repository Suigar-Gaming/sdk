'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PlinkoFormValues } from '@/lib/suigar-types';

export function PlinkoForm({
	value,
	onChange,
}: {
	value: PlinkoFormValues;
	onChange: (patch: Partial<PlinkoFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="plinkoConfigId">Board config ID</FieldLabel>
				<Input
					id="plinkoConfigId"
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
