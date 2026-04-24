import type { SuigarClient } from '@suigar/sdk';
import type { Transaction } from '@mysten/sui/transactions';
import type { CoinSide, PvPCoinflipAction } from '@suigar/sdk/games';

import { PVP_GAMES, STANDARD_GAMES } from '@/lib/suigar-app';

export type StandardGameId = (typeof STANDARD_GAMES)[number];
export type PvPGameId = (typeof PVP_GAMES)[number];
export type PvPAction = PvPCoinflipAction;
export type SupportedCoinKey = 'sui' | 'usdc';

export type SharedFields = {
	stake: string;
};

export type CoinflipFormValues = SharedFields & {
	side: CoinSide;
};

export type LimboFormValues = SharedFields & {
	targetMultiplier: string;
	scale: string;
};

export type PlinkoFormValues = SharedFields & {
	configId: string;
};

export type RangeFormValues = SharedFields & {
	leftPoint: string;
	rightPoint: string;
	outOfRange: boolean;
	scale: string;
};

export type WheelFormValues = SharedFields & {
	configId: string;
};

export type PvPCreateFormValues = SharedFields & {
	side: CoinSide;
	isPrivate: boolean;
};

export type PvPJoinFormValues = {
	gameId: string;
};

export type PvPCancelFormValues = {
	gameId: string;
};

export type StandardForms = {
	coinflip: CoinflipFormValues;
	limbo: LimboFormValues;
	plinko: PlinkoFormValues;
	range: RangeFormValues;
	wheel: WheelFormValues;
};

export type PvPForms = {
	create: PvPCreateFormValues;
	join: PvPJoinFormValues;
	cancel: PvPCancelFormValues;
};

export type PvPCoinflipLobbyGame = Awaited<
	ReturnType<SuigarClient['getPvPCoinflipGames']>
>[number];

export type EventLogRow = {
	id: string;
	timestamp: string;
	eventType: string;
	digest: string;
	gameId?: string;
	actor?: string;
	details: string;
	raw: unknown;
};

export type BuildResult = {
	transaction: Transaction;
	code: string;
};
