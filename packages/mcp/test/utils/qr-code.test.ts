// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Buffer } from 'node:buffer';
import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	encodeQR: vi.fn<() => string>(),
}));

vi.mock('qr', () => ({
	default: mocks.encodeQR,
}));

const { createQrCodeDataUrl } = await import('../../src/utils/qr-code.js');

describe('createQrCodeDataUrl', () => {
	it('encodes an SVG QR code as a data URL with default options', () => {
		mocks.encodeQR.mockReturnValue('<svg viewBox="0 0 10 10"></svg>');

		const result = createQrCodeDataUrl('0xabc');
		const encoded = result.replace('data:image/svg+xml;base64,', '');

		expect(mocks.encodeQR).toHaveBeenCalledWith('0xabc', 'svg', {
			ecc: 'medium',
			border: 1,
			scale: 2,
		});
		expect(Buffer.from(encoded, 'base64').toString('utf8')).toBe('<svg viewBox="0 0 10 10"></svg>');
	});

	it('passes through QR rendering options', () => {
		mocks.encodeQR.mockReturnValue('<svg></svg>');

		createQrCodeDataUrl('suigar', {
			errorCorrectionLevel: 'high',
			border: 4,
			scale: 6,
		});

		expect(mocks.encodeQR).toHaveBeenCalledWith('suigar', 'svg', {
			ecc: 'high',
			border: 4,
			scale: 6,
		});
	});
});
