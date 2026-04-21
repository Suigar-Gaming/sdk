// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { BetMetadataInput } from './bet-metadata.type';
import type { SuigarConfig } from './suigar-config.type';

export type SharedBetTransactionOptions = {
	config: SuigarConfig;
	owner: string;
	coinType: string;
	stake: number | bigint;
	cashStake?: number | bigint;
	betCount?: number | bigint;
	metadata?: BetMetadataInput;
	gasBudget?: number | bigint;
	sender?: string;
	allowGasCoinShortcut?: boolean;
};
