'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PvPCoinflipJoinFormValues } from '@/lib/suigar-types';

export function PvPCoinflipJoinForm({
	value,
}: {
	value: PvPCoinflipJoinFormValues;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="pvpGameId">Game ID</FieldLabel>
				<Input
					id="pvpGameId"
					placeholder="Select a lobby card to fill the game id"
					value={value.gameId}
					readOnly
					aria-readonly="true"
					className="h-11 cursor-default rounded-2xl bg-muted/35 px-4 font-mono text-xs md:text-sm"
				/>
			</Field>
		</div>
	);
}
