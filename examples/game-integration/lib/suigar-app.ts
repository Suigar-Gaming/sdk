import { DEFAULT_RANGE_SCALE, RANGE_POINT_LIMIT } from '@suigar/sdk/utils';
import type {
	PvPAction,
	PvPForms,
	StandardGameId,
	StandardForms,
	SharedFields,
	SupportedCoinKey,
} from '@/lib/suigar-types';

export const STANDARD_GAMES = [
	'coinflip',
	'limbo',
	'plinko',
	'range',
	'wheel',
] as const;

export const PVP_ACTIONS = ['create', 'join', 'cancel'] as const;

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
		leftPoint: '25',
		rightPoint: '75',
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
	return STANDARD_GAMES.includes(value as (typeof STANDARD_GAMES)[number]);
}

export function isPvPAction(value: string | null): value is PvPAction {
	return PVP_ACTIONS.includes(value as (typeof PVP_ACTIONS)[number]);
}

export function parseOptionalNumber(value: string) {
	const trimmed = value.trim().replace(',', '.');
	return trimmed ? Number(trimmed) : undefined;
}

export function getRangePointMax(scale?: number) {
	const effectiveScale =
		scale && Number.isFinite(scale) && scale > 0 ? scale : DEFAULT_RANGE_SCALE;
	return RANGE_POINT_LIMIT / effectiveScale;
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
