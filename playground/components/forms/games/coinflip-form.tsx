'use client';

import type * as React from 'react';

import { StandardGameFields } from '@/components/forms/shared-game-fields';
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
	onStakeBlur,
	stakeDescription,
}: {
	value: CoinflipFormValues;
	onChange: (patch: Partial<CoinflipFormValues>) => void;
	onStakeBlur?: () => void;
	stakeDescription?: React.ReactNode;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel>Side</FieldLabel>
				<Select
					value={value.side}
					onValueChange={(side: CoinflipFormValues['side']) => onChange({ side })}
				>
					<SelectTrigger
						aria-label="Select coinflip side"
						className="h-11 px-4 bg-background/55 rounded-2xl"
					>
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="heads">Heads</SelectItem>
						<SelectItem value="tails">Tails</SelectItem>
					</SelectContent>
				</Select>
			</Field>
			<StandardGameFields
				value={value}
				onChange={onChange}
				onStakeBlur={onStakeBlur}
				description={stakeDescription}
			/>
		</div>
	);
}
