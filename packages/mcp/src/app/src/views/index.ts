// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ComponentType } from 'react';

import { asRecord } from '../lib/format.js';
import { createInspectorViewModel } from '../lib/inspector.js';
import { ConfigView } from './config.js';
import { ExecutionStatusView } from './execution-status.js';
import { GameMetadataView } from './game-metadata.js';
import { NftView } from './nft.js';
import { ReferralView } from './referral.js';
import { SessionWalletView } from './session-wallet.js';
import { TransactionView } from './transaction.js';
import { WalletView } from './wallet.js';

export type AppViewProps = {
	payload: unknown;
	errors: Array<string>;
};

export type ResolvedAppView = {
	coinBadge: string | null;
	title: string;
	View: ComponentType<AppViewProps>;
};

export function resolveAppView(payload: unknown): ResolvedAppView {
	const result = asRecord(payload);
	if (result.sessionWallet) {
		return {
			coinBadge: null,
			title: 'Session Wallet',
			View: SessionWalletView,
		};
	}
	const wallet = asRecord(result.wallet);
	if (Array.isArray(wallet.balances) || Array.isArray(wallet.coins)) {
		return { coinBadge: null, title: 'Wallet', View: WalletView };
	}
	if (result.referral && !result.summary) {
		return { coinBadge: null, title: 'Referral Rewards', View: ReferralView };
	}
	const coinBadge = createInspectorViewModel(payload, []).coinBadge;
	if (Array.isArray(result.ownedNfts)) {
		return { coinBadge, title: 'NFT Collection', View: NftView };
	}
	if (result.game && !result.summary) {
		return { coinBadge, title: 'Game Metadata', View: GameMetadataView };
	}
	if (result.supportedGames && !result.summary) {
		return { coinBadge, title: 'Suigar Config', View: ConfigView };
	}
	const execution = asRecord(result.execution);
	if (result.execution && (!result.summary || execution.wallet === 'session')) {
		return {
			coinBadge: null,
			title: 'Transaction Status',
			View: ExecutionStatusView,
		};
	}
	return { coinBadge, title: 'Transaction Inspector', View: TransactionView };
}
