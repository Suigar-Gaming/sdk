// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export const BUILDER_MODES = [
	'build',
	'dry-run',
	'read-only',
	'execute',
] as const;
export const ADDRESS_DESCRIPTION: string =
	'Sui address or SuiNS name such as 0xabc..., name.sui, or sub.name.sui; required for build and dry-run modes.';
export const COIN_TYPE_DESCRIPTION: string =
	'Move coin type such as 0x2::sui::SUI. Defaults to the SDK-configured SUI coin type.';
