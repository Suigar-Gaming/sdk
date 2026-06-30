// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';
import type { suigar, SuigarClient, SuigarNetwork } from '@suigar/sdk';
import type { Game, PvPCoinflipAction } from '@suigar/sdk/games';

export type SuigarConfig = ReturnType<SuigarClient['getConfig']>;
export type SuigarConfigOverrides = NonNullable<
	Parameters<typeof suigar>[0]
>['config'];
export type DryRunResult = SuiClientTypes.SimulateTransactionResult<{
	effects: true;
	events: true;
	balanceChanges: true;
}>;

export type BuilderMode = 'build' | 'dry-run' | 'read-only';

export type SuigarMcpConfigInput = {
	network?: SuigarNetwork;
	providerUrl?: string;
	config?: SuigarConfigOverrides;
	partner?: string;
};

export type ResolvedMcpConfig = {
	network: SuigarNetwork;
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
	game?: Game;
	action?: PvPCoinflipAction;
	coinType?: string;
	stake?: string;
};

export type ReadOnlyPlan = {
	mode: 'read-only';
	network: SuigarNetwork;
	game: Game;
	action?: PvPCoinflipAction;
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
	network: SuigarNetwork;
	config: ResolvedMcpConfig;
	summary: TransactionSummary;
	transactionBytesBase64?: string;
	dryRun?: DryRunResult;
};

export type ReadConfigResult = {
	network: SuigarNetwork;
	config: ResolvedMcpConfig;
	supportedGames: Array<{
		id: Game;
		label: string;
		tools: string[];
	}>;
};

export type ReadGameMetadataResult = ReadConfigResult & {
	game: {
		id: Game;
		label: string;
		packageId: string;
		coinType: string;
		action?: PvPCoinflipAction;
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
