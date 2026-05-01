'use client';

import { DEFAULT_RANGE_SCALE } from '@suigar/sdk/utils';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import {
	Field,
	FieldCode,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldTitle,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { getRangePointMax, parseOptionalNumber } from '@/lib/suigar-app';
import type { RangeFormValues } from '@/lib/suigar-types';

export function RangeForm({
	value,
	onChange,
}: {
	value: RangeFormValues;
	onChange: (patch: Partial<RangeFormValues>) => void;
}) {
	const configuredScale = parseOptionalNumber(value.scale);
	const effectiveScale =
		configuredScale && Number.isFinite(configuredScale) && configuredScale > 0
			? configuredScale
			: DEFAULT_RANGE_SCALE;
	const maxPoint = getRangePointMax(configuredScale);

	return (
		<div className="space-y-6">
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Field>
					<FieldLabel htmlFor="leftPoint">Left point</FieldLabel>
					<Input
						id="leftPoint"
						type="number"
						step="any"
						min="0"
						max={maxPoint}
						value={value.leftPoint}
						onChange={(event) => onChange({ leftPoint: event.target.value })}
					/>
					<FieldDescription>
						Allowed range: <FieldCode>0</FieldCode> to{' '}
						<FieldCode>{String(maxPoint)}</FieldCode> with scale{' '}
						<FieldCode>{String(effectiveScale)}</FieldCode>.
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
						value={value.rightPoint}
						onChange={(event) => onChange({ rightPoint: event.target.value })}
					/>
					<FieldDescription>
						The SDK sends <FieldCode>Math.round(point * scale)</FieldCode>, so
						larger scales reduce the allowed frontend range.
					</FieldDescription>
				</Field>
			</FieldGroup>
			<FieldGroup className="grid gap-4 md:grid-cols-2">
				<Field>
					<FieldLabel htmlFor="rangeScale">Scale (optional)</FieldLabel>
					<Input
						id="rangeScale"
						type="number"
						step="1"
						min="1"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
					<FieldDescription>
						Leave empty to use the SDK default scale of{' '}
						<FieldCode>{String(DEFAULT_RANGE_SCALE)}</FieldCode>, which allows
						points from <FieldCode>0</FieldCode> to <FieldCode>100</FieldCode>.
					</FieldDescription>
				</Field>
				<div className="flex h-full w-full items-start md:justify-start">
					<Field className="w-full rounded-xl border border-border/70 bg-background/40 px-4 py-3 md:max-w-sm">
						<div className="flex items-center justify-between gap-3">
							<FieldTitle>Out of range</FieldTitle>
							<Switch
								checked={value.outOfRange}
								onCheckedChange={(checked) => onChange({ outOfRange: checked })}
							/>
						</div>
						<FieldDescription>
							Flip the win condition outside the interval.
						</FieldDescription>
					</Field>
				</div>
			</FieldGroup>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
