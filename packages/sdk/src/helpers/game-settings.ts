// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';

export function resolvePackageMoveStructName(
	structName: string,
	packageId: string,
) {
	return normalizeStructTag({
		...parseStructTag(structName),
		address: packageId,
	});
}

export function resolveTypeNameStructTag(structName: string) {
	const parsed = parseStructTag(structName);

	return normalizeStructTag({
		...parsed,
		address: parsed.address.replace(/^0x/, ''),
	});
}
