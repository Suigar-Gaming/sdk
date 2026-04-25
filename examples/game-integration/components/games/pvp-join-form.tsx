'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PvPJoinFormValues } from '@/lib/suigar-types';

export function PvPJoinForm({
	value,
	onChange,
}: {
	value: PvPJoinFormValues;
	onChange: (patch: Partial<PvPJoinFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="pvpGameId">Game ID</FieldLabel>
				<Input
					id="pvpGameId"
					placeholder="Select a lobby card or paste a game id"
					value={value.gameId}
					onChange={(event) => onChange({ gameId: event.target.value })}
				/>
			</Field>
		</div>
	);
}
