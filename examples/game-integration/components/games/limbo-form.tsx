'use client';

import { LIMBO_MULTIPLIER_SCALE } from '@suigar/sdk/utils';
import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { parseOptionalNumber } from '@/lib/suigar-app';
import type { LimboFormValues } from '@/lib/suigar-types';

export function LimboForm({
	value,
	onChange,
}: {
	value: LimboFormValues;
	onChange: (patch: Partial<LimboFormValues>) => void;
}) {
	const configuredScale = parseOptionalNumber(value.scale);
	const effectiveScale =
		configuredScale && Number.isFinite(configuredScale) && configuredScale > 0
			? configuredScale
			: LIMBO_MULTIPLIER_SCALE;

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Label htmlFor="targetMultiplier">Target multiplier</Label>
					<Input
						id="targetMultiplier"
						type="number"
						step="any"
						value={value.targetMultiplier}
						onChange={(event) =>
							onChange({ targetMultiplier: event.target.value })
						}
					/>
					<p className="text-xs text-muted-foreground">
						The SDK sends `Math.round(targetMultiplier * scale)`. With scale{' '}
						{effectiveScale}, a target multiplier of 2.5 becomes{' '}
						{Math.round(2.5 * effectiveScale)} onchain.
					</p>
				</div>
				<div className="space-y-2">
					<Label htmlFor="limboScale">Scale (optional)</Label>
					<Input
						id="limboScale"
						type="number"
						step="1"
						min="1"
						value={value.scale}
						onChange={(event) => onChange({ scale: event.target.value })}
						placeholder="defaults to SDK scale"
					/>
					<p className="text-xs text-muted-foreground">
						Leave empty to use the SDK default scale of {LIMBO_MULTIPLIER_SCALE}
						.
					</p>
				</div>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
