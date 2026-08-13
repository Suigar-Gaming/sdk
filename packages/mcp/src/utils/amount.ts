// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { parseToUnits, SUI_DECIMALS } from '@mysten/sui/utils';

export const BASE_UNIT_AMOUNT_PATTERN: RegExp = /^\d+$/u;
export const CURRENCY_AMOUNT_PATTERN: RegExp = /^(?:\d+|\d+\.\d+|\.\d+)$/u;
export const POSITIVE_INTEGER_PATTERN: RegExp = /^[1-9]\d*$/u;
const AMOUNT_FIELD_NAME_VALUES = [
	'amount',
	'house_edge_amount',
	'max_payout',
	'max_stake',
	'min_stake',
	'outcome_amount',
	'payout_amount',
	'stake_amount',
	'stake_per_player',
] as const;
const TRAILING_ZERO_PATTERN: RegExp = /0+$/u;

export type FormattedAmount = {
	raw: string;
	display: string;
};

export type AmountFieldName = (typeof AMOUNT_FIELD_NAME_VALUES)[number];

export const AMOUNT_FIELD_NAMES: ReadonlySet<AmountFieldName> = new Set(AMOUNT_FIELD_NAME_VALUES);

export function isAmountFieldName(key: string): key is AmountFieldName {
	return (AMOUNT_FIELD_NAMES as ReadonlySet<string>).has(key);
}

export function formatBaseUnitAmount(
	value: string | number | bigint,
	decimals = SUI_DECIMALS,
): string {
	const raw = String(value);
	const negative = raw.startsWith('-');
	const digits = negative ? raw.slice(1) : raw;
	if (!BASE_UNIT_AMOUNT_PATTERN.test(digits)) {
		return raw;
	}
	if (decimals === 0) {
		return `${negative ? '-' : ''}${digits}`;
	}

	const padded = digits.length <= decimals ? digits.padStart(decimals + 1, '0') : digits;
	const whole = padded.slice(0, -decimals) || '0';
	const fraction = padded.slice(-decimals).replace(TRAILING_ZERO_PATTERN, '');
	return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
}

export function formatAmount(value: unknown, decimals?: number): FormattedAmount | null {
	if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
		return null;
	}
	const raw = String(value);
	return {
		raw,
		display: formatBaseUnitAmount(raw, decimals),
	};
}

export function toCurrencyAmountText(value: unknown, fieldName: string): string {
	if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
		return String(value);
	}
	if (typeof value === 'string' && CURRENCY_AMOUNT_PATTERN.test(value.trim())) {
		return value.trim();
	}
	throw new TypeError(
		`Missing or invalid ${fieldName}. Provide a non-negative currency amount such as 1, 2, or 1.5.`,
	);
}

export function toBaseUnits(value: unknown, fieldName: string, decimals: number): bigint {
	const amount = toCurrencyAmountText(value, fieldName);
	try {
		return parseToUnits(amount, decimals);
	} catch (error) {
		throw new RangeError(
			`Invalid ${fieldName}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}
