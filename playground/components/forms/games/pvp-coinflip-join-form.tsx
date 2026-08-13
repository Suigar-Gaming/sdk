'use client';

import { CopyableGameIdField } from '@/components/forms/copyable-game-id-field';
import type { PvPCoinflipJoinFormValues } from '@/lib/suigar-types';

export function PvPCoinflipJoinForm({ value }: { value: PvPCoinflipJoinFormValues }) {
	return (
		<div className="space-y-6">
			<CopyableGameIdField
				id="pvpGameId"
				label="Game ID"
				placeholder="Select a lobby card to fill the game id"
				value={value.gameId}
			/>
		</div>
	);
}
