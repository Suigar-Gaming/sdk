'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PvPCancelFormValues } from '@/lib/suigar-types';

export function PvPCancelForm({
	value,
	onChange,
}: {
	value: PvPCancelFormValues;
	onChange: (patch: Partial<PvPCancelFormValues>) => void;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="cancelGameId">Game ID</FieldLabel>
				<Input
					id="cancelGameId"
					placeholder="Select one of your lobbies or paste a game id"
					value={value.gameId}
					onChange={(event) => onChange({ gameId: event.target.value })}
				/>
			</Field>
		</div>
	);
}
