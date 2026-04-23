'use client';

import { SharedGameFields } from '@/components/forms/shared-game-fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PvPCancelFormValues } from '@/lib/suigar-app';

export function PvPCancelForm({
	value,
	onChange,
}: {
	value: PvPCancelFormValues;
	onChange: (patch: Partial<PvPCancelFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="cancelGameId">Game ID</Label>
				<Input
					id="cancelGameId"
					value={value.gameId}
					onChange={(event) => onChange({ gameId: event.target.value })}
				/>
			</div>
			<SharedGameFields value={value} onChange={onChange} />
		</div>
	);
}
