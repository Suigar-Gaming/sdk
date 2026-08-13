'use client';

import type * as React from 'react';
import { DEFAULT_RANGE_SCALE } from '@suigar/sdk/utils';
import { StandardGameFields } from '@/components/forms/shared-game-fields';
import { Field, FieldCode, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getRangePointMax, parseOptionalNumber } from '@/lib/suigar-app';
import type { RangeFormValues } from '@/lib/suigar-types';

export function RangeForm({
	value,
	onChange,
	onStakeBlur,
	stakeDescription,
	rangeBoundsDescription,
}: {
	value: RangeFormValues;
	onChange: (patch: Partial<RangeFormValues>) => void;
	onStakeBlur?: () => void;
	stakeDescription?: React.ReactNode;
	rangeBoundsDescription?: React.ReactNode;
}) {
	const configuredScale = parseOptionalNumber(value.scale);
	const effectiveScale =
		configuredScale && Number.isFinite(configuredScale) && configuredScale > 0
			? configuredScale
			: DEFAULT_RANGE_SCALE;
	const maxPoint = getRangePointMax(configuredScale);

	return (
		<div className="space-y-6">
			{rangeBoundsDescription}
			<FieldGroup className="grid md:grid-cols-2 gap-4">
				<Field>
					<FieldLabel htmlFor="leftPoint">Left point</FieldLabel>
					<Input
						id="leftPoint"
						type="number"
						step="any"
						min="0"
						max={maxPoint}
						className="h-11 px-4 bg-background/55 rounded-2xl"
						value={value.leftPoint}
						onChange={(event) => onChange({ leftPoint: event.target.value })}
					/>
					<FieldDescription size="sm">
						Allowed range: <FieldCode>0</FieldCode> to <FieldCode>{String(maxPoint)}</FieldCode>{' '}
						with scale <FieldCode>{String(effectiveScale)}</FieldCode>
					</FieldDescription>
				</Field>
				<Field>
					<FieldLabel htmlFor="rightPoint">Right point</FieldLabel>
					<Input
						id="rightPoint"
						type="number"
						step="any"
						min="0"
						max={maxPoint}
						className="h-11 px-4 bg-background/55 rounded-2xl"
						value={value.rightPoint}
						onChange={(event) => onChange({ rightPoint: event.target.value })}
					/>
					<FieldDescription size="sm">
						The SDK sends <FieldCode>Math.round(point * scale)</FieldCode>, so larger scales reduce
						the allowed frontend range
					</FieldDescription>
				</Field>
			</FieldGroup>
			<FieldGroup className="grid md:grid-cols-2 gap-4">
				<Field>
					<FieldLabel htmlFor="rangeScale">Scale (optional)</FieldLabel>
					<Input
						id="rangeScale"
						type="number"
						step="1"
						min="1"
						className="h-11 px-4 bg-background/55 rounded-2xl"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
					<FieldDescription size="sm">
						Leave empty to use the SDK default scale of{' '}
						<FieldCode>{String(DEFAULT_RANGE_SCALE)}</FieldCode>, which allows points from{' '}
						<FieldCode>0</FieldCode> to <FieldCode>100</FieldCode>
					</FieldDescription>
				</Field>
				<div className="flex h-full w-full items-start md:justify-start">
					<Field className="w-full md:max-w-sm p-4 border-border/70 bg-background/45 rounded-2xl border">
						<div className="flex items-center justify-between gap-3">
							<FieldLabel htmlFor="range-out-of-range">Out of range</FieldLabel>
							<Switch
								id="range-out-of-range"
								size="default"
								checked={value.outOfRange}
								onCheckedChange={(checked: boolean) => onChange({ outOfRange: checked })}
							/>
						</div>
						<FieldDescription size="sm">
							Flip the win condition outside the interval
						</FieldDescription>
					</Field>
				</div>
			</FieldGroup>
			<StandardGameFields
				value={value}
				onChange={onChange}
				onStakeBlur={onStakeBlur}
				description={stakeDescription}
			/>
		</div>
	);
}
