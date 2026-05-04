'use client';

import type * as React from 'react';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { SharedFields } from '@/lib/suigar-types';

type SharedGameFieldsProps<T extends SharedFields> = {
	value: T;
	onChange: (patch: Partial<T>) => void;
	description?: React.ReactNode;
};

export function SharedGameFields<T extends SharedFields>({
	value,
	onChange,
	description,
}: SharedGameFieldsProps<T>) {
	return (
		<Field>
			<FieldLabel htmlFor="stake">Stake</FieldLabel>
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
			{description}
		</Field>
	);
}
