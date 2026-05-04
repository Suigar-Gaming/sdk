'use client';

import { LoaderCircle } from 'lucide-react';
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
import type { GameConfigOption, PlinkoFormValues } from '@/lib/suigar-types';

export function PlinkoForm({
	value,
	onChange,
	configOptions,
	isConfigLoading,
	configError,
	stakeDescription,
}: {
	value: PlinkoFormValues;
	onChange: (patch: Partial<PlinkoFormValues>) => void;
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
				<FieldLabel htmlFor="plinkoConfigId">Board config ID</FieldLabel>
				{playableConfigOptions.length > 0 ? (
					<Select
						value={value.configId}
						onValueChange={(configId) => onChange({ configId })}
					>
						<SelectTrigger id="plinkoConfigId">
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
						id="plinkoConfigId"
						type="number"
						step="1"
						value={value.configId}
						onChange={(event) => onChange({ configId: event.target.value })}
					/>
				)}
				<FieldDescription>
					{selectedConfig ? (
						selectedConfig.description
					) : isConfigLoading ? (
						<span className="inline-flex items-center gap-1.5">
							<LoaderCircle className="size-3.5 animate-spin" />
							Loading Plinko configs from on-chain parameters.
						</span>
					) : configError ? (
						`Unable to load on-chain Plinko configs: ${configError}`
					) : (
						'Enter a board config id manually if on-chain configs are unavailable.'
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
