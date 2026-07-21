// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';
import type { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag } from '@mysten/sui/utils';
import { vi } from 'vitest';

type ContractCallMock = (options: unknown) => (tx: Transaction) => unknown;
const textEncoder = new TextEncoder();

export const TEST_CONFIG = {
	packageIds: {
		legacyNft: '0xlegacy-nft',
		core: '0xcore',
		coinflip: '0xabc',
		limbo: '0x1',
		plinko: '0x2',
		pvpCoinflip: '0x3',
		range: '0x4',
		wheel: '0x5',
	},
	objectIds: {
		sweetHouse: '0x456',
		legacyNftFactory: '0xlegacy-nft-factory',
	},
	registryIds: {
		pvpCoinflip: '0xregistry',
	},
	coins: {
		sui: {
			coinType: normalizeStructTag('0x2::sui::SUI'),
			decimals: 9,
			priceInfoObjectId: '0x789',
		},
		usdc: {
			coinType: normalizeStructTag('0xusdc::coin::USDC'),
			decimals: 6,
			priceInfoObjectId: '0x987',
		},
	},
} as const;

export function writeU64(value: bigint): number[] {
	const bytes = Array.from({ length: 8 }, () => 0);
	for (let index = 0; index < 8; index += 1) {
		bytes[index] = Number((value >> BigInt(8 * index)) & 0xffn);
	}
	return bytes;
}

export function encodeFloat(value: number): number[] {
	if (value === 0) {
		return [0, ...writeU64(0n), ...writeU64(0n)];
	}

	const isNegative = value < 0;
	const magnitude = Math.abs(value);
	const exponent = Math.floor(Math.log2(magnitude));
	const mantissa = BigInt(Math.round(magnitude * Math.pow(2, 52 - exponent)));

	return [
		isNegative ? 1 : 0,
		...writeU64(BigInt(exponent)),
		...writeU64(mantissa),
	];
}

export function encodeString(value: string): number[] {
	return Array.from(bcs.string().serialize(value).toBytes());
}

export function encodeUtf8(value: string): number[] {
	return Array.from(textEncoder.encode(value));
}

export function createContractCallMock() {
	return vi.fn<ContractCallMock>(() => (tx: Transaction) => tx.object('0x777'));
}

export function getFirstMockArg<T>(mock: { mock: { calls: unknown[][] } }): T {
	return mock.mock.calls[0]?.[0] as T;
}
