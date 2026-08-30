// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from 'node:buffer';
import encodeQR from 'qr';

type QrErrorCorrectionLevel = 'low' | 'medium' | 'quartile' | 'high';

export function createQrCodeDataUrl(
	value: string,
	options: {
		errorCorrectionLevel?: QrErrorCorrectionLevel;
		border?: number;
		scale?: number;
	} = {},
): string {
	const svg = encodeQR(value, 'svg', {
		ecc: options.errorCorrectionLevel ?? 'medium',
		border: options.border ?? 1,
		scale: options.scale ?? 2,
	});

	return `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}`;
}
