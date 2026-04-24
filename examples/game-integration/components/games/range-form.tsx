'use client';

import { DEFAULT_RANGE_SCALE } from '@suigar/sdk/utils';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="leftPoint">Left point</Label>
					<Input
						id="leftPoint"
						type="number"
						step="any"
						min="0"
						max={maxPoint}
						value={value.leftPoint}
						onChange={(event) => onChange({ leftPoint: event.target.value })}
					/>
					<p className="text-xs text-muted-foreground">
						Allowed range: 0 to {maxPoint} with scale {effectiveScale}.
					</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="rightPoint">Right point</Label>
					<Input
						id="rightPoint"
						type="number"
						step="any"
						min="0"
						max={maxPoint}
						value={value.rightPoint}
						onChange={(event) => onChange({ rightPoint: event.target.value })}
					/>
					<p className="text-xs text-muted-foreground">
						The SDK sends `Math.round(point * scale)`, so larger scales reduce
						the allowed frontend range.
					</p>
				</div>
			</div>
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="rangeScale">Scale (optional)</Label>
					<Input
						id="rangeScale"
						type="number"
						step="1"
						min="1"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
					<p className="text-xs text-muted-foreground">
						Leave empty to use the SDK default scale of {DEFAULT_RANGE_SCALE},
						which allows points from 0 to 100.
					</p>
				</div>
				<div className="flex items-end">
					<div className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-background/40 px-4 py-3">
						<div>
							<p className="text-sm font-medium">Out of range</p>
							<p className="text-xs text-muted-foreground">
								Flip the win condition outside the interval.
							</p>
						</div>
						<Switch
							checked={value.outOfRange}
							onCheckedChange={(checked) => onChange({ outOfRange: checked })}
						/>
					</div>
				</div>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
