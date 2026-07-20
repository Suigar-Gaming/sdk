// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { SUI_DECIMALS } from '@mysten/sui/utils';
import type { FormattedAmount } from './types.js';

export const formatBaseUnitAmount = (
	value: string | number | bigint,
	decimals = SUI_DECIMALS,
): string => {
	const raw = String(value);
	const negative = raw.startsWith('-');
	const digits = negative ? raw.slice(1) : raw;
	if (!/^\d+$/u.test(digits)) {
		return raw;
	}
	if (decimals === 0) {
		return `${negative ? '-' : ''}${digits}`;
	}

	const padded =
		digits.length <= decimals ? digits.padStart(decimals + 1, '0') : digits;
	const whole = padded.slice(0, -decimals) || '0';
	const fraction = padded.slice(-decimals).replace(/0+$/u, '');
	return `${negative ? '-' : ''}${whole}${fraction ? `.${fraction}` : ''}`;
};

export const formatAmount = (
	value: unknown,
	decimals?: number,
): FormattedAmount | null => {
	if (
		typeof value !== 'string' &&
		typeof value !== 'number' &&
		typeof value !== 'bigint'
	) {
		return null;
	}
	const raw = String(value);
	return {
		raw,
		display: formatBaseUnitAmount(raw, decimals),
	};
};
