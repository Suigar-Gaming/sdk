'use client';

import { CopyableGameIdField } from '@/components/forms/copyable-game-id-field';
import type { PvPCoinflipCancelFormValues } from '@/lib/suigar-types';

export function PvPCoinflipCancelForm({ value }: { value: PvPCoinflipCancelFormValues }) {
	return (
		<div className="space-y-6">
			<CopyableGameIdField
				id="cancelGameId"
				label="Game ID"
				placeholder="Select one of your lobbies to fill the game id"
				value={value.gameId}
			/>
		</div>
	);
}
