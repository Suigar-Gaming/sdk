'use client';

import * as React from 'react';
import {
	Field,
	FieldCode,
	FieldDescription,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
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

type BetCountControl = {
	value: string;
	onChange: (value: string) => void;
	betCountLimit?: BetCountLimitSummary;
	isLoading?: boolean;
};

const BetCountControlContext = React.createContext<BetCountControl | null>(
	null,
);

export function StandardGameBetCountProvider({
	children,
	...control
}: React.PropsWithChildren<BetCountControl>) {
	return (
		<BetCountControlContext.Provider value={control}>
			{children}
		</BetCountControlContext.Provider>
	);
}

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
	SharedGameFieldsProps<T>;

export function StandardGameFields<T extends StandardSharedFields>({
	value,
	onChange,
	onStakeBlur,
	description,
}: StandardGameFieldsProps<T>) {
	const betCountControl = React.useContext(BetCountControlContext);

	return (
		<div className="grid gap-4 md:grid-cols-2">
			<StakeField
				value={value.stake}
				onChange={(stake) => onChange({ stake } as Partial<T>)}
				onBlur={onStakeBlur}
				description={description}
			/>
			{betCountControl ? <BetCountField {...betCountControl} /> : null}
		</div>
	);
}

export function BetCountField({
	value,
	onChange,
	betCountLimit,
	isLoading = false,
}: {
	value: string;
	onChange: (value: string) => void;
	betCountLimit?: BetCountLimitSummary;
	isLoading?: boolean;
}) {
	const isBetCountFixed = betCountLimit?.max === BigInt(1);

	return (
		<Field>
			<FieldLabel htmlFor="betCount">Bet count</FieldLabel>
			<Input
				id="betCount"
				type="number"
				step="1"
				min="1"
				max={betCountLimit?.max.toString()}
				disabled={isBetCountFixed || isLoading}
				inputMode="numeric"
				className="h-11 px-4 bg-background/55 rounded-2xl"
				value={value}
				onChange={(event) => onChange(event.target.value)}
				placeholder="defaults to 1"
			/>
			{isLoading ? (
				<FieldDescription size="sm">
					<span className="inline-flex items-center gap-1.5">
						<Spinner className="size-3.5" />
						Loading maximum bet count from on-chain parameters
					</span>
				</FieldDescription>
			) : betCountLimit ? (
				<FieldDescription size="sm">
					Maximum {betCountLimit.label} per transaction:{' '}
					<FieldCode>{betCountLimit.max.toString()}</FieldCode>
				</FieldDescription>
			) : (
				<FieldDescription size="sm">
					No maximum bet count is specified on-chain for this game
				</FieldDescription>
			)}
		</Field>
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
