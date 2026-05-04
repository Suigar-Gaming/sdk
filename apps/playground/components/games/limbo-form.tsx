'use client';

import type * as React from 'react';
import { DEFAULT_LIMBO_MULTIPLIER_SCALE } from '@suigar/sdk/utils';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import {
	Field,
	FieldCode,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { parseOptionalNumber } from '@/lib/suigar-app';
import type { LimboFormValues } from '@/lib/suigar-types';

export function LimboForm({
	value,
	onChange,
	stakeDescription,
	targetMultiplierDescription,
}: {
	value: LimboFormValues;
	onChange: (patch: Partial<LimboFormValues>) => void;
	stakeDescription?: React.ReactNode;
	targetMultiplierDescription?: React.ReactNode;
}) {
	const configuredScale = parseOptionalNumber(value.scale);
	const effectiveScale =
		configuredScale && Number.isFinite(configuredScale) && configuredScale > 0
			? configuredScale
			: DEFAULT_LIMBO_MULTIPLIER_SCALE;

	return (
		<div className="space-y-6">
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Field>
					<FieldLabel htmlFor="targetMultiplier">Target multiplier</FieldLabel>
					<Input
						id="targetMultiplier"
						type="number"
						step="any"
						value={value.targetMultiplier}
						onChange={(event) =>
							onChange({ targetMultiplier: event.target.value })
						}
					/>
					<FieldDescription>
						The SDK sends{' '}
						<FieldCode>Math.round(targetMultiplier * scale)</FieldCode>. With
						scale <FieldCode>{String(effectiveScale)}</FieldCode>, a target
						multiplier of <FieldCode>2.5</FieldCode> becomes{' '}
						<FieldCode>{String(Math.round(2.5 * effectiveScale))}</FieldCode>{' '}
						on-chain.
					</FieldDescription>
					{targetMultiplierDescription}
				</Field>
				<Field>
					<FieldLabel htmlFor="limboScale">Scale (optional)</FieldLabel>
					<Input
						id="limboScale"
						type="number"
						step="1"
						min="1"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
					<FieldDescription>
						Leave empty to use the SDK default scale of{' '}
						<FieldCode>{String(DEFAULT_LIMBO_MULTIPLIER_SCALE)}</FieldCode>.
					</FieldDescription>
				</Field>
			</FieldGroup>
			<SharedGameFields
				value={value}
				onChange={onChange}
				description={stakeDescription}
			/>
		</div>
	);
}
