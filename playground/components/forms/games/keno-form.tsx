'use client';

import type * as React from 'react';
import { StandardGameFields } from '@/components/forms/shared-game-fields';
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
import type { GameConfigOption, KenoFormValues } from '@/lib/suigar-types';

export function KenoForm({
	value,
	onChange,
	onStakeBlur,
	configOptions,
	isConfigLoading,
	configError,
	stakeDescription,
	picksDescription,
}: {
	value: KenoFormValues;
	onChange: (patch: Partial<KenoFormValues>) => void;
	onStakeBlur?: () => void;
	configOptions?: Array<GameConfigOption>;
	isConfigLoading?: boolean;
	configError?: string | null;
	stakeDescription?: React.ReactNode;
	picksDescription?: React.ReactNode;
}) {
	const selectedConfig = configOptions?.find((option) => option.id === value.configId) ?? null;
	const playableConfigOptions = configOptions?.filter((option) => option.isPlayable) ?? [];

	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="kenoConfigId">Keno config ID</FieldLabel>
				{playableConfigOptions.length > 0 ? (
					<Select
						value={value.configId}
						onValueChange={(configId: string) => onChange({ configId })}
					>
						<SelectTrigger
							id="kenoConfigId"
							aria-label="Select Keno config"
							className="h-11 px-4 bg-background/55 rounded-2xl"
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
						id="kenoConfigId"
						type="number"
						step="1"
						className="h-11 px-4 bg-background/55 rounded-2xl"
						value={value.configId}
						onChange={(event) => onChange({ configId: event.target.value })}
					/>
				)}
				<FieldDescription size="sm">
					{selectedConfig ? (
						selectedConfig.description
					) : isConfigLoading ? (
						<span className="inline-flex items-center gap-1.5">
							<Spinner className="size-3.5" />
							Loading Keno configs from on-chain parameters
						</span>
					) : configError ? (
						`Unable to load on-chain Keno configs: ${configError}`
					) : (
						'Enter a Keno config id manually if on-chain configs are unavailable'
					)}
				</FieldDescription>
			</Field>
			<Field>
				<FieldLabel htmlFor="kenoPicks">Picks</FieldLabel>
				<Input
					id="kenoPicks"
					className="h-11 px-4 bg-background/55 rounded-2xl"
					value={value.picks}
					onChange={(event) => onChange({ picks: event.target.value })}
				/>
				{picksDescription ?? (
					<FieldDescription size="sm">Comma-separated board positions.</FieldDescription>
				)}
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
