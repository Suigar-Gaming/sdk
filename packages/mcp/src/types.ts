// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { suigar, SuigarClient } from '@suigar/sdk';

export type SuigarConfig = ReturnType<SuigarClient['getConfig']>;
export type SuigarConfigOverrides = NonNullable<
	Parameters<typeof suigar>[0]
>['config'];

export type SuigarMcpNetwork = 'mainnet' | 'testnet';

export type StandardGameId =
	'coinflip' | 'limbo' | 'plinko' | 'range' | 'wheel';

export type PvpCoinflipAction = 'create' | 'join' | 'cancel';

export type SupportedGameId = StandardGameId | 'pvp-coinflip';

export type BuilderMode = 'build' | 'dry-run' | 'read-only';

export type SuigarMcpConfigInput = {
	network?: SuigarMcpNetwork;
	providerUrl?: string;
	config?: SuigarConfigOverrides;
	partner?: string;
};

export type ResolvedMcpConfig = {
	network: SuigarMcpNetwork;
	providerUrl: string;
	sdk: SuigarConfig;
};

export type TransactionCommandSummary = {
	kind: string;
	target?: string;
	typeArguments?: string[];
};

export type TransactionSummary = {
	sender: string | null;
	gasBudget: string | null;
	gasPrice: string | null;
	commandCount: number;
	commands: TransactionCommandSummary[];
	inputs: number;
	objectInputs: string[];
	game?: SupportedGameId;
	action?: PvpCoinflipAction;
	coinType?: string;
	stake?: string;
};

export type ReadOnlyPlan = {
	mode: 'read-only';
	network: SuigarMcpNetwork;
	game: SupportedGameId;
	action?: PvpCoinflipAction;
	config: ResolvedMcpConfig;
	plan: {
		target: string | null;
		typeArguments: string[];
		requiredInputs: string[];
		notes: string[];
	};
};

export type BuildTransactionResult = {
	mode: 'build' | 'dry-run';
	network: SuigarMcpNetwork;
	config: ResolvedMcpConfig;
	summary: TransactionSummary;
	transactionBytesBase64?: string;
	dryRun?: unknown;
};

export type ReadConfigResult = {
	network: SuigarMcpNetwork;
	config: ResolvedMcpConfig;
	supportedGames: Array<{
		id: SupportedGameId;
		label: string;
		tools: string[];
	}>;
};

export type ReadGameMetadataResult = ReadConfigResult & {
	game: {
		id: SupportedGameId;
		label: string;
		packageId: string;
		coinType: string;
		action?: PvpCoinflipAction;
		notes: string[];
	} | null;
};

export type ToolStructuredResult =
	| ReadConfigResult
	| ReadGameMetadataResult
	| ReadOnlyPlan
	| BuildTransactionResult;

export type ToolTextResult = {
	content: [{ type: 'text'; text: string }];
	structuredContent: ToolStructuredResult;
	_meta?: Record<string, unknown>;
};
