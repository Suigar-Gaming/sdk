// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';

function replaceStructTagAddress(structName: string, address: string) {
	return normalizeStructTag({
		...parseStructTag(structName),
		address,
	});
}

export function resolveGameSettingsKeyType(
	structName: string,
	packageId: string,
) {
	return replaceStructTagAddress(structName, packageId);
}

export function resolveCoinTypeNameForTypeNameKey(structName: string) {
	return replaceStructTagAddress(
		structName,
		normalizeStructTag(structName).replace(/^0x/, ''),
	);
}
