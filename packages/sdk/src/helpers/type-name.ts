// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	normalizeStructTag,
	normalizeSuiAddress,
	parseStructTag,
} from '@mysten/sui/utils';

/**
 * Formats a struct type as the fully qualified name stored in a Move TypeName
 * dynamic-field key.
 */
export function resolveCoinTypeNameForTypeNameKey(structName: string): string {
	const { address } = parseStructTag(structName);

	return normalizeStructTag({
		...parseStructTag(structName),
		address: normalizeSuiAddress(address).replace(/^0x/, ''),
	});
}
