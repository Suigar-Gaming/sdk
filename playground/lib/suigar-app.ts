import { DEFAULT_RANGE_SCALE, RANGE_POINT_LIMIT } from '@suigar/sdk/utils';
import type {
	PvPCoinflipForms,
	SharedFields,
	StandardForms,
} from '@/lib/suigar-types';

const DEFAULT_SHARED_FIELDS: SharedFields = {
	stake: '1',
};

const DEFAULT_STANDARD_SHARED_FIELDS = {
	...DEFAULT_SHARED_FIELDS,
	betCount: '',
};

export const DEFAULT_STANDARD_FORMS: StandardForms = {
	coinflip: {
		...DEFAULT_STANDARD_SHARED_FIELDS,
		side: 'heads',
	},
	limbo: {
		...DEFAULT_STANDARD_SHARED_FIELDS,
		targetMultiplier: '2.5',
		scale: '',
	},
	plinko: {
		...DEFAULT_STANDARD_SHARED_FIELDS,
		configId: '',
	},
	range: {
		...DEFAULT_STANDARD_SHARED_FIELDS,
		leftPoint: '25',
		rightPoint: '75',
		outOfRange: false,
		scale: '',
	},
	soccer: {
		...DEFAULT_STANDARD_SHARED_FIELDS,
		configId: '',
		countryId: '',
		shotZoneId: '',
	},
	wheel: {
		...DEFAULT_STANDARD_SHARED_FIELDS,
		configId: '',
	},
};

export const DEFAULT_PVP_FORMS: PvPCoinflipForms = {
	create: {
		...DEFAULT_SHARED_FIELDS,
		side: 'tails',
		isPrivate: false,
	},
	join: {
		gameId: '',
	},
	cancel: {
		gameId: '',
	},
};

export function parseOptionalNumber(value?: string) {
	const trimmed = value?.trim().replace(',', '.') ?? '';
	return trimmed ? Number(trimmed) : undefined;
}

export function getRangePointMax(scale?: number) {
	const effectiveScale =
		scale && Number.isFinite(scale) && scale > 0 ? scale : DEFAULT_RANGE_SCALE;
	return RANGE_POINT_LIMIT / effectiveScale;
}

export function toAtomicAmount(value: string | undefined, decimals: number) {
	const trimmed = value?.trim().replace(',', '.') ?? '';
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
		return 'N/A';
	}

	if (value.length <= 18) {
		return value;
	}

	return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

export function bigintToString(value: unknown) {
	return typeof value === 'bigint' ? value.toString() : String(value);
}
