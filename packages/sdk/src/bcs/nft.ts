// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { bcs } from '@mysten/sui/bcs';

const LegacyNftUrl = bcs.struct('LegacyNftUrl', {
	url: bcs.string(),
});

const LegacyNftSpec = bcs.struct('LegacyNftSpec', {
	id: bcs.Address,
	name: bcs.string(),
	description: bcs.string(),
	url: LegacyNftUrl,
	supply: bcs.u64(),
	available: bcs.u64(),
	price: bcs.u64(),
});

const LegacyNftFactoryEntry = bcs.struct('LegacyNftFactoryEntry', {
	key: bcs.Address,
	value: LegacyNftSpec,
});

export const LegacyNftFactory = bcs.struct('LegacyNftFactory', {
	id: bcs.Address,
	specs: bcs.struct('LegacyNftSpecs', {
		contents: bcs.vector(LegacyNftFactoryEntry),
	}),
});

export const LegacyNft = bcs.struct('LegacyNft', {
	id: bcs.Address,
	spec_id: bcs.Address,
	name: bcs.string(),
	description: bcs.string(),
	url: LegacyNftUrl,
	image_url: LegacyNftUrl,
});
