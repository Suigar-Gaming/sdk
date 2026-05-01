'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Field, FieldLabel } from '@/components/ui/field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import type { CoinflipFormValues } from '@/lib/suigar-types';

export function CoinflipForm({
	value,
	onChange,
}: {
	value: CoinflipFormValues;
	onChange: (patch: Partial<CoinflipFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel>Side</FieldLabel>
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
			</Field>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
