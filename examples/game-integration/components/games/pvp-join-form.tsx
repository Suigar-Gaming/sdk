'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { PvPJoinFormValues } from '@/lib/suigar-app';

export function PvPJoinForm({
	value,
	onChange,
}: {
	value: PvPJoinFormValues;
	onChange: (patch: Partial<PvPJoinFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<Label htmlFor="pvpGameId">Game ID</Label>
				<Input
					id="pvpGameId"
					value={value.gameId}
					onChange={(event) => onChange({ gameId: event.target.value })}
				/>
			</div>
		</div>
	);
}
