'use client';

import type * as React from 'react';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import type { GameConfigOption, WheelFormValues } from '@/lib/suigar-types';

export function WheelForm({
	value,
	onChange,
	configOptions,
	isConfigLoading,
	configError,
	stakeDescription,
}: {
	value: WheelFormValues;
	onChange: (patch: Partial<WheelFormValues>) => void;
	configOptions?: GameConfigOption[];
	isConfigLoading?: boolean;
	configError?: string | null;
	stakeDescription?: React.ReactNode;
}) {
	const selectedConfig =
		configOptions?.find((option) => option.id === value.configId) ?? null;
	const playableConfigOptions =
		configOptions?.filter((option) => option.isPlayable) ?? [];

	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="wheelConfigId">Wheel config ID</FieldLabel>
				{playableConfigOptions.length > 0 ? (
					<Select
						value={value.configId}
						onValueChange={(configId) => onChange({ configId })}
					>
						<SelectTrigger
							id="wheelConfigId"
							className="h-11 rounded-2xl bg-background/55 px-4"
						>
							<SelectValue />
						</SelectTrigger>
						<SelectContent className="max-h-[min(22rem,calc(100vh-6rem))]">
							{playableConfigOptions.map((option) => (
								<SelectItem key={option.id} value={option.id}>
									{option.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						id="wheelConfigId"
						type="number"
						step="1"
						className="h-11 rounded-2xl bg-background/55 px-4"
						value={value.configId}
						onChange={(event) => onChange({ configId: event.target.value })}
					/>
				)}
				<FieldDescription>
					{selectedConfig ? (
						selectedConfig.description
					) : isConfigLoading ? (
						<span className="inline-flex items-center gap-1.5">
							<Spinner className="size-3.5" />
							Loading Wheel configs from on-chain parameters.
						</span>
					) : configError ? (
						`Unable to load on-chain Wheel configs: ${configError}`
					) : (
						'Enter a wheel config id manually if on-chain configs are unavailable.'
					)}
				</FieldDescription>
			</Field>
			<SharedGameFields
				value={value}
				onChange={onChange}
				description={stakeDescription}
			/>
		</div>
	);
}
