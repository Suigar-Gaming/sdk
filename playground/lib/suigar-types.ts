import type { Transaction } from '@mysten/sui/transactions';
import type { SuigarClient } from '@suigar/sdk';
import type { CoinSide, PvPCoinflipAction } from '@suigar/sdk/games';
import { PVP_GAMES, STANDARD_GAMES } from '@/lib/suigar-app';

export type StandardGameId = (typeof STANDARD_GAMES)[number];
export type PvPGameId = (typeof PVP_GAMES)[number];
export type PvPAction = PvPCoinflipAction;
export type SupportedCoinKey = 'sui' | 'usdc';

export type SharedFields = {
	stake: string;
};

export type StakeRangeSummary = {
	min: string;
	max: string;
	kind?: 'range' | 'minimum';
};

export type NumberRangeSummary = {
	min: number;
	max: number;
};

export type RangeBoundsSummary = {
	minZoneSize: number;
	maxZoneSize: number;
	minRtp: number;
	maxRtp: number;
};

export type GameConfigOption = {
	id: string;
	label: string;
	description?: string;
	details?: Array<{
		label: string;
		value: string;
	}>;
	multiplierValues?: string[];
	isPlayable: boolean;
	stakeRange: StakeRangeSummary;
};

export type GameSettingsDetail = {
	label: string;
	value: string;
};

export type StandardGameParametersSummary = {
	stakeRange: StakeRangeSummary;
	configOptions?: GameConfigOption[];
	topLevelDetails?: GameSettingsDetail[];
	targetMultiplierRange?: NumberRangeSummary;
	rangeBounds?: RangeBoundsSummary;
};

export type PvPGameParametersSummary = {
	stakeRange: StakeRangeSummary;
	topLevelDetails?: GameSettingsDetail[];
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

export type PvPCoinflipCreateFormValues = SharedFields & {
	side: CoinSide;
	isPrivate: boolean;
};

export type PvPCoinflipJoinFormValues = {
	gameId: string;
};

export type PvPCoinflipCancelFormValues = {
	gameId: string;
};

export type StandardForms = {
	coinflip: CoinflipFormValues;
	limbo: LimboFormValues;
	plinko: PlinkoFormValues;
	range: RangeFormValues;
	wheel: WheelFormValues;
};

export type PvPCoinflipForms = {
	create: PvPCoinflipCreateFormValues;
	join: PvPCoinflipJoinFormValues;
	cancel: PvPCoinflipCancelFormValues;
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
