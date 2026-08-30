// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { base64 } from '@scure/base';
import encodeQR from 'qr';

const TEXT_ENCODER: TextEncoder = new TextEncoder();
type QrOptions = NonNullable<Parameters<typeof encodeQR>[2]>;

export function createQrCodeDataUrl(value: string, options: QrOptions = {}): string {
	const svg = encodeQR(value, 'svg', {
		...options,
		ecc: options.ecc ?? 'medium',
		border: options.border ?? 1,
		scale: options.scale ?? 2,
	});

	return `data:image/svg+xml;base64,${base64.encode(TEXT_ENCODER.encode(svg))}`;
}
