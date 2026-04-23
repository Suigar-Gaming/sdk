'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SharedFields } from '@/lib/suigar-app';

type SharedGameFieldsProps<T extends SharedFields> = {
	value: T;
	onChange: (patch: Partial<T>) => void;
};

export function SharedGameFields<T extends SharedFields>({
	value,
	onChange,
}: SharedGameFieldsProps<T>) {
	return (
		<div className="space-y-2">
			<Label htmlFor="stake">Stake</Label>
			<Input
				id="stake"
				type="number"
				step="any"
				inputMode="decimal"
				value={value.stake}
				onChange={(event) =>
					onChange({ stake: event.target.value } as Partial<T>)
				}
				placeholder="1"
			/>
		</div>
	);
}
