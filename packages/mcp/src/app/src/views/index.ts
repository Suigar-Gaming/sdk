// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ComponentType } from 'react';
import { asRecord } from '../lib/format.js';
import { createInspectorViewModel } from '../lib/inspector.js';
import { ConfigView } from './config.js';
import { GameMetadataView } from './game-metadata.js';
import { NftView } from './nft.js';
import { TransactionView } from './transaction.js';

export type AppViewProps = {
	payload: unknown;
	errors: string[];
};

export type ResolvedAppView = {
	coinBadge: string | null;
	title: string;
	View: ComponentType<AppViewProps>;
};

export const resolveAppView = (payload: unknown): ResolvedAppView => {
	const result = asRecord(payload);
	const coinBadge = createInspectorViewModel(payload, []).coinBadge;
	if (Array.isArray(result.ownedNfts)) {
		return { coinBadge, title: 'Legacy NFT Collection', View: NftView };
	}
	if (result.game && !result.summary) {
		return { coinBadge, title: 'Game Metadata', View: GameMetadataView };
	}
	if (result.supportedGames && !result.summary) {
		return { coinBadge, title: 'Suigar Config', View: ConfigView };
	}
	return { coinBadge, title: 'Transaction Inspector', View: TransactionView };
};
