// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export type BetMetadataPrimitive = string | number | boolean | bigint;
export type BetMetadataValue =
	BetMetadataPrimitive | Uint8Array | Array<number>;
export type BetMetadataInput = Record<
	string,
	BetMetadataValue | null | undefined
>;

export type EncodedBetMetadata = {
	keys: Array<string>;
	values: Array<Array<number>>;
};
