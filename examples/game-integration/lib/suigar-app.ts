import type { Transaction } from '@mysten/sui/transactions';

export const STANDARD_GAMES = [
	'coinflip',
	'limbo',
	'plinko',
	'range',
	'wheel',
] as const;

export const PVP_ACTIONS = ['create', 'join', 'cancel'] as const;

export type StandardGameId = (typeof STANDARD_GAMES)[number];
export type PvPAction = (typeof PVP_ACTIONS)[number];
export type SupportedCoinKey = 'sui' | 'usdc';

export type SharedFields = {
	stake: string;
};

export type CoinflipFormValues = SharedFields & {
	side: 'heads' | 'tails';
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
	side: 'heads' | 'tails';
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

export const COIN_DECIMALS: Record<SupportedCoinKey, number> = {
	sui: 9,
	usdc: 6,
};

export const DEFAULT_SHARED_FIELDS: SharedFields = {
	stake: '1',
};

export const DEFAULT_STANDARD_FORMS: StandardForms = {
	coinflip: {
		...DEFAULT_SHARED_FIELDS,
		side: 'heads',
	},
	limbo: {
		...DEFAULT_SHARED_FIELDS,
		targetMultiplier: '2.5',
		scale: '',
	},
	plinko: {
		...DEFAULT_SHARED_FIELDS,
		configId: '3',
	},
	range: {
		...DEFAULT_SHARED_FIELDS,
		leftPoint: '0.95',
		rightPoint: '1.05',
		outOfRange: false,
		scale: '',
	},
	wheel: {
		...DEFAULT_SHARED_FIELDS,
		configId: '1',
	},
};

export const DEFAULT_PVP_FORMS: PvPForms = {
	create: {
		...DEFAULT_SHARED_FIELDS,
		side: 'tails',
		isPrivate: false,
	},
	join: {
		gameId: '0xYOUR_GAME_ID',
	},
	cancel: {
		gameId: '0xYOUR_GAME_ID',
	},
};

export function isStandardGame(value: string | null): value is StandardGameId {
	return STANDARD_GAMES.includes(value as StandardGameId);
}

export function isPvPAction(value: string | null): value is PvPAction {
	return PVP_ACTIONS.includes(value as PvPAction);
}

export function parseOptionalNumber(value: string) {
	const trimmed = value.trim().replace(',', '.');
	return trimmed ? Number(trimmed) : undefined;
}

export function toAtomicAmount(value: string, decimals: number) {
	const trimmed = value.trim().replace(',', '.');
	if (!trimmed) {
		throw new Error('Stake is required.');
	}

	if (!/^\d+(\.\d+)?$/.test(trimmed)) {
		throw new Error('Stake must be a positive number.');
	}

	const [whole, fraction = ''] = trimmed.split('.');
	if (fraction.length > decimals) {
		throw new Error(
			`Stake supports up to ${decimals} decimal places for this coin.`,
		);
	}

	const paddedFraction = fraction.padEnd(decimals, '0');
	return BigInt(`${whole}${paddedFraction}`);
}

export function compactAddress(value?: string) {
	if (!value) {
		return 'n/a';
	}

	if (value.length <= 18) {
		return value;
	}

	return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function bigintToString(value: unknown) {
	return typeof value === 'bigint' ? value.toString() : String(value);
}
