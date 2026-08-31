// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
	encodeQR: vi.fn<() => string>(),
}));

vi.mock('qr', () => ({
	default: mocks.encodeQR,
}));

const { createQrCodeDataUrl } = await import('../../src/utils/qr-code.js');

describe('createQrCodeDataUrl', () => {
	it('uses the QR encoder data-url output with default options', () => {
		mocks.encodeQR.mockReturnValue('data:image/gif;base64,R0lGODlh');

		const result = createQrCodeDataUrl('0xabc');

		expect(mocks.encodeQR).toHaveBeenCalledWith('0xabc', 'data-url', {
			ecc: 'medium',
			border: 1,
			scale: 2,
		});
		expect(result).toBe('data:image/gif;base64,R0lGODlh');
	});

	it('passes through QR rendering options', () => {
		mocks.encodeQR.mockReturnValue('<svg></svg>');

		createQrCodeDataUrl('suigar', {
			ecc: 'high',
			border: 4,
			scale: 6,
		});

		expect(mocks.encodeQR).toHaveBeenCalledWith('suigar', 'data-url', {
			ecc: 'high',
			border: 4,
			scale: 6,
		});
	});
});
