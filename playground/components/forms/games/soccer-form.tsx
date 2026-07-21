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
import type {
	GameConfigOption,
	GameSelectionOption,
	SoccerFormValues,
} from '@/lib/suigar-types';

export function SoccerForm({
	value,
	onChange,
	onStakeBlur,
	configOptions,
	countryOptions,
	isConfigLoading,
	configError,
	stakeDescription,
}: {
	value: SoccerFormValues;
	onChange: (patch: Partial<SoccerFormValues>) => void;
	onStakeBlur?: () => void;
	configOptions?: GameConfigOption[];
	countryOptions?: GameSelectionOption[];
	isConfigLoading?: boolean;
	configError?: string | null;
	stakeDescription?: React.ReactNode;
}) {
	const selectedConfig =
		configOptions?.find((option) => option.id === value.configId) ?? null;
	const playableConfigOptions =
		configOptions?.filter((option) => option.isPlayable) ?? [];
	const shotZoneOptions = selectedConfig?.multiplierValues ?? [];

	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="soccerConfigId">Soccer config ID</FieldLabel>
				{playableConfigOptions.length > 0 ? (
					<Select
						value={value.configId}
						onValueChange={(configId: string) => onChange({ configId })}
					>
						<SelectTrigger
							id="soccerConfigId"
							aria-label="Select Soccer config"
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
						id="soccerConfigId"
						type="number"
						min="0"
						max="255"
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
							Loading Soccer configs from on-chain parameters.
						</span>
					) : configError ? (
						`Unable to load on-chain Soccer configs: ${configError}`
					) : (
						'Enter a Soccer config id manually if on-chain configs are unavailable.'
					)}
				</FieldDescription>
			</Field>

			<div className="grid gap-6 sm:grid-cols-2">
				<Field>
					<FieldLabel htmlFor="soccerCountryId">Country ID</FieldLabel>
					{countryOptions && countryOptions.length > 0 ? (
						<Select
							value={value.countryId}
							onValueChange={(countryId: string) => onChange({ countryId })}
						>
							<SelectTrigger
								id="soccerCountryId"
								aria-label="Select Soccer country"
								className="h-11 px-4 bg-background/55 rounded-2xl"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="max-h-[min(22rem,calc(100vh-6rem))]">
								{countryOptions.map((option) => (
									<SelectItem key={option.id} value={option.id}>
										{option.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<Input
							id="soccerCountryId"
							type="number"
							min="0"
							max="65535"
							step="1"
							className="h-11 px-4 bg-background/55 rounded-2xl"
							value={value.countryId}
							onChange={(event) => onChange({ countryId: event.target.value })}
						/>
					)}
					<FieldDescription size="sm">
						Choose an available country from the game settings.
					</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="soccerShotZoneId">Shot zone ID</FieldLabel>
					{shotZoneOptions.length > 0 ? (
						<Select
							value={value.shotZoneId}
							onValueChange={(shotZoneId: string) => onChange({ shotZoneId })}
						>
							<SelectTrigger
								id="soccerShotZoneId"
								aria-label="Select Soccer shot zone"
								className="h-11 px-4 bg-background/55 rounded-2xl"
							>
								<SelectValue />
							</SelectTrigger>
							<SelectContent className="max-h-[min(22rem,calc(100vh-6rem))]">
								{shotZoneOptions.map((option) => (
									<SelectItem key={option.id} value={option.id}>
										Zone {option.id} (x{option.value})
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					) : (
						<Input
							id="soccerShotZoneId"
							type="number"
							min="0"
							max="255"
							step="1"
							className="h-11 px-4 bg-background/55 rounded-2xl"
							value={value.shotZoneId}
							onChange={(event) => onChange({ shotZoneId: event.target.value })}
						/>
					)}
					<FieldDescription size="sm">
						Use a shot zone available in the selected config.
					</FieldDescription>
				</Field>
			</div>

			<StandardGameFields
				value={value}
				onChange={onChange}
				onStakeBlur={onStakeBlur}
				description={stakeDescription}
			/>
		</div>
	);
}
