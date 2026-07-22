'use client';

import type * as React from 'react';
import {
	Field,
	FieldCode,
	FieldDescription,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type {
	BetCountLimitSummary,
	SharedFields,
	StandardSharedFields,
} from '@/lib/suigar-types';

type SharedGameFieldsProps<T extends SharedFields> = {
	value: T;
	onChange: (patch: Partial<T>) => void;
	onStakeBlur?: () => void;
	description?: React.ReactNode;
};

export function SharedGameFields<T extends SharedFields>({
	value,
	onChange,
	onStakeBlur,
	description,
}: SharedGameFieldsProps<T>) {
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<StakeField
				value={value.stake}
				onChange={(stake) => onChange({ stake } as Partial<T>)}
				onBlur={onStakeBlur}
				description={description}
				className="md:col-span-2"
			/>
		</div>
	);
}

type StandardGameFieldsProps<T extends StandardSharedFields> =
	SharedGameFieldsProps<T> & {
		betCountLimit?: BetCountLimitSummary;
	};

export function StandardGameFields<T extends StandardSharedFields>({
	value,
	onChange,
	onStakeBlur,
	description,
	betCountLimit,
}: StandardGameFieldsProps<T>) {
	const isBetCountFixed = betCountLimit?.max === BigInt(1);
	return (
		<div className="grid gap-4 md:grid-cols-2">
			<StakeField
				value={value.stake}
				onChange={(stake) => onChange({ stake } as Partial<T>)}
				onBlur={onStakeBlur}
				description={description}
			/>
			<Field>
				<FieldLabel htmlFor="betCount">Bet count</FieldLabel>
				<Input
					id="betCount"
					type="number"
					step="1"
					min="1"
					max={betCountLimit?.max.toString()}
					disabled={isBetCountFixed}
					inputMode="numeric"
					className="h-11 px-4 bg-background/55 rounded-2xl"
					value={value.betCount ?? ''}
					onChange={(event) =>
						onChange({ betCount: event.target.value } as Partial<T>)
					}
					placeholder="defaults to 1"
				/>
				{betCountLimit ? (
					<FieldDescription size="sm">
						Maximum {betCountLimit.label} per transaction:{' '}
						<FieldCode>{betCountLimit.max.toString()}</FieldCode>
					</FieldDescription>
				) : null}
			</Field>
		</div>
	);
}

function StakeField({
	value,
	onChange,
	onBlur,
	description,
	className,
}: {
	value: string;
	onChange: (value: string) => void;
	onBlur?: () => void;
	description?: React.ReactNode;
	className?: string;
}) {
	return (
		<Field className={className}>
			<FieldLabel htmlFor="stake">Stake</FieldLabel>
			<Input
				id="stake"
				type="number"
				step="any"
				inputMode="decimal"
				className="h-11 px-4 bg-background/55 rounded-2xl"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				onBlur={onBlur}
				placeholder="1"
			/>
			{description}
		</Field>
	);
}
