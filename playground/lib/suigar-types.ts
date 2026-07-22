import type { Transaction } from '@mysten/sui/transactions';
import type { SuigarClient, SuigarCoin } from '@suigar/sdk';
import type {
	CoinSide,
	PvPCoinflipAction,
	PvPGame,
	StandardGame,
} from '@suigar/sdk/games';

export type StandardGameId = StandardGame;
export type PvPGameId = PvPGame;
export type PvPAction = PvPCoinflipAction;
export type SupportedCoinKey = SuigarCoin;

export type SharedFields = {
	stake: string;
};

export type StandardSharedFields = SharedFields & {
	betCount: string;
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
	multiplierValues?: Array<{
		id: string;
		value: string;
	}>;
	isPlayable: boolean;
	stakeRange: StakeRangeSummary;
};

export type GameSettingsDetail = {
	label: string;
	value: string;
};

export type GameSelectionOption = {
	id: string;
	label: string;
};

export type BetCountLimitSummary = {
	max: bigint;
	label: string;
};

export type StandardGameParametersSummary = {
	stakeRange: StakeRangeSummary;
	betCountLimit?: BetCountLimitSummary;
	configOptions?: GameConfigOption[];
	countryOptions?: GameSelectionOption[];
	topLevelDetails?: GameSettingsDetail[];
	targetMultiplierRange?: NumberRangeSummary;
	rangeBounds?: RangeBoundsSummary;
};

export type PvPGameParametersSummary = {
	stakeRange: StakeRangeSummary;
	topLevelDetails?: GameSettingsDetail[];
};

export type CoinflipFormValues = StandardSharedFields & {
	side: CoinSide;
};

export type LimboFormValues = StandardSharedFields & {
	targetMultiplier: string;
	scale: string;
};

export type PlinkoFormValues = StandardSharedFields & {
	configId: string;
};

export type RangeFormValues = StandardSharedFields & {
	leftPoint: string;
	rightPoint: string;
	outOfRange: boolean;
	scale: string;
};

export type SoccerFormValues = StandardSharedFields & {
	configId: string;
	countryId: string;
	shotZoneId: string;
};

export type WheelFormValues = StandardSharedFields & {
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
	soccer: SoccerFormValues;
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
