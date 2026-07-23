// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { SuiClientTypes } from '@mysten/sui/client';
import type { suigar, SuigarClient, SuigarNetwork } from '@suigar/sdk';
import type { Game, PvPCoinflipAction } from '@suigar/sdk/games';
import type { FormattedAmount } from '../utils/index.js';

export type SuigarConfig = ReturnType<SuigarClient['getConfig']>;
export type SuigarConfigOverrides = NonNullable<
	Parameters<typeof suigar>[0]
>['config'];
export type RawDryRunResult = SuiClientTypes.SimulateTransactionResult<{
	effects: true;
	events: true;
	balanceChanges: true;
}>;

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| Array<JsonValue>
	| { [key: string]: JsonValue };

export type DryRunResult = Record<string, JsonValue>;

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
	typeArguments?: Array<string>;
};

export type TransactionSummaryDetails = {
	game?: Game;
	action?: PvPCoinflipAction;
	coinType?: string;
	stake?: string;
	stakeDisplay?: string;
	coinDecimals?: number;
	gameInputs?: Record<string, JsonValue>;
};

export type TransactionSummaryContext = Omit<
	TransactionSummaryDetails,
	'stake'
> & {
	stake?: TransactionSummaryDetails['stake'] | bigint | number;
};

export type TransactionSummaryFormattingContext = Pick<
	TransactionSummaryDetails,
	'coinDecimals'
>;

export type TransactionSummary = {
	sender: string | null;
	gasBudget: string | null;
	gasBudgetDisplay: string | null;
	gasPrice: string | null;
	commandCount: number;
	commands: Array<TransactionCommandSummary>;
	inputs: number;
	objectInputs: Array<string>;
} & TransactionSummaryDetails;

export type DryRunEventSummary = {
	type: string;
	game?: Game;
	eventName?: string;
	fields: Record<string, JsonValue>;
};

export type DryRunSummary = {
	success: boolean;
	error: string | null;
	gasUsed: {
		computation: FormattedAmount | null;
		storage: FormattedAmount | null;
		rebate: FormattedAmount | null;
		nonRefundableStorageFee: FormattedAmount | null;
		net: FormattedAmount | null;
	};
	balanceChanges: Array<{
		address: string;
		coinType: string;
		amount: FormattedAmount;
	}>;
	events: Array<DryRunEventSummary>;
};

export type ReadOnlyPlan = {
	mode: 'read-only';
	network: SuigarNetwork;
	game: Game;
	action?: PvPCoinflipAction;
	config: ResolvedMcpConfig;
	plan: {
		target: string | null;
		typeArguments: Array<string>;
		requiredInputs: Array<string>;
		notes: Array<string>;
	};
};

export type BuildTransactionResult = {
	mode: 'build' | 'dry-run';
	network: SuigarNetwork;
	config: ResolvedMcpConfig;
	summary: TransactionSummary;
	transactionBytesBase64?: string;
	dryRun?: DryRunResult;
	dryRunSummary?: DryRunSummary;
	errors?: Array<string>;
};

export type ReadConfigResult = {
	network: SuigarNetwork;
	config: ResolvedMcpConfig;
	supportedGames: Array<{
		id: Game;
		label: string;
		tools: Array<string>;
	}>;
};

export type ReadGameMetadataResult = ReadConfigResult & {
	game: {
		id: Game;
		label: string;
		packageId: string;
		coinType: string;
		parameters: JsonValue;
		ignoreCache: boolean;
		notes: Array<string>;
	};
};

export type NftSpec = {
	id: string;
	name: string;
	description: string;
	url: string;
	supply: string;
	available: string;
	price: string;
	priceDisplay: string;
};

export type Nft = {
	id: string;
	specId: string;
	name: string;
	description: string;
	url: string;
	imageUrl: string;
};

export type ListNftsResult = {
	network: SuigarNetwork;
	config: ResolvedMcpConfig;
	owner: string;
	nftType: string;
	nftCatalog: Array<NftSpec>;
	ownedNfts: Array<Nft>;
};

export type ToolStructuredResult =
	| ReadConfigResult
	| ReadGameMetadataResult
	| ListNftsResult
	| ReadOnlyPlan
	| BuildTransactionResult;

export type ToolTextResult = {
	content: [{ type: 'text'; text: string }];
	structuredContent: ToolStructuredResult;
	_meta?: Record<string, unknown>;
};
