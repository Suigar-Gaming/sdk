'use client';

import { Eraser } from 'lucide-react';
import type * as React from 'react';
import { StandardGameFields } from '@/components/forms/shared-game-fields';
import { Button } from '@/components/ui/button';
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
import { cn } from '@/lib/utils';

function toPickValues(value: KenoFormValues['picks'] | string): Array<string> {
	return Array.isArray(value)
		? value
		: value
				.split(',')
				.map((pick) => pick.trim())
				.filter(Boolean);
}

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
	const selectedPicks = toPickValues(value.picks);
	const boardSize = selectedConfig?.keno?.boardSize ?? 40;
	const minPicks = selectedConfig?.keno?.minPicks ?? 1;
	const maxPicks = selectedConfig?.keno?.maxPicks ?? 10;
	const selectedPickSet = new Set(selectedPicks);
	const boardPositions = Array.from({ length: boardSize }, (_item, index) => String(index + 1));

	function togglePick(pick: string) {
		if (selectedPickSet.has(pick)) {
			onChange({ picks: selectedPicks.filter((item) => item !== pick) });
			return;
		}

		if (selectedPicks.length >= maxPicks) {
			return;
		}

		onChange({
			picks: [...selectedPicks, pick].sort((left, right) => Number(left) - Number(right)),
		});
	}

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
				<div className="flex items-center justify-between gap-3">
					<FieldLabel>Picks</FieldLabel>
					<div className="flex items-center gap-2">
						<Button
							type="button"
							variant="ghost"
							size="xs"
							disabled={selectedPicks.length === 0}
							onClick={() => onChange({ picks: [] })}
						>
							<Eraser className="size-3.5" aria-hidden />
							Clear
						</Button>
						<span className="text-xs font-medium text-muted-foreground">
							{selectedPicks.length}/{maxPicks}
						</span>
					</div>
				</div>
				<fieldset className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
					{boardPositions.map((pick) => {
						const isSelected = selectedPickSet.has(pick);
						const isDisabled = !isSelected && selectedPicks.length >= maxPicks;

						return (
							<Button
								key={pick}
								type="button"
								variant={isSelected ? 'control-active' : 'control'}
								size="icon-sm"
								aria-pressed={isSelected}
								disabled={isDisabled}
								onClick={() => togglePick(pick)}
								className={cn('aspect-square h-auto min-h-7 w-full rounded-md p-0 text-[11px]')}
							>
								{pick}
							</Button>
						);
					})}
				</fieldset>
				{picksDescription ?? (
					<FieldDescription size="sm">
						Select {minPicks} to {maxPicks} board positions.
					</FieldDescription>
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
