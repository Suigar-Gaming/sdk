'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import type { PvPCoinflipCancelFormValues } from '@/lib/suigar-types';

export function PvPCoinflipCancelForm({
	value,
}: {
	value: PvPCoinflipCancelFormValues;
}) {
	return (
		<div className="space-y-6">
			<Field>
				<FieldLabel htmlFor="cancelGameId">Game ID</FieldLabel>
				<Input
					id="cancelGameId"
					placeholder="Select one of your lobbies to fill the game id"
					value={value.gameId}
					readOnly
					aria-readonly="true"
					className="cursor-default bg-muted/35 font-mono text-xs md:text-sm"
				/>
			</Field>
		</div>
	);
}
