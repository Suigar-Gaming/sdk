// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { SuiGrpcClient } from '@mysten/sui/grpc';
import type { Transaction } from '@mysten/sui/transactions';
import { normalizeStructTag, toBase64 } from '@mysten/sui/utils';
import { suigar } from '@suigar/sdk';
import type {
	BuilderMode,
	BuildTransactionResult,
	ResolvedMcpConfig,
	SuigarConfigOverrides,
	SuigarMcpConfigInput,
	SuigarMcpNetwork,
	SupportedGameId,
	TransactionSummary,
} from './types.js';

const DEFAULT_PROVIDER_URLS = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
} as const satisfies Record<SuigarMcpNetwork, string>;

export const DEFAULT_NETWORK: SuigarMcpNetwork = 'testnet';

export const normalizeNetwork = (
	network: string | undefined = DEFAULT_NETWORK,
): SuigarMcpNetwork => {
	if (network === 'mainnet' || network === 'testnet') {
		return network;
	}

	throw new RangeError(
		`Unsupported network: ${network}. Use "mainnet" or "testnet".`,
	);
};

export const getProviderUrl = (
	network: SuigarMcpNetwork,
	providerUrl?: string,
) => providerUrl ?? DEFAULT_PROVIDER_URLS[network];

export type SuigarClientBundle = {
	client: {
		suigar: {
			getConfig(): ResolvedMcpConfig['sdk'];
			serializeTransactionToBase64(transaction: Transaction): Promise<string>;
			tx: {
				createBetTransaction(
					gameId: string,
					options: Record<string, unknown>,
				): Transaction;
				createPvPCoinflipTransaction(
					action: string,
					options: Record<string, unknown>,
				): Transaction;
			};
		};
	};
	rawClient: SuiGrpcClient;
	config: ResolvedMcpConfig;
};

export const createSuigarClient = (
	input: SuigarMcpConfigInput = {},
): SuigarClientBundle => {
	const network = normalizeNetwork(input.network);
	const rawClient = new SuiGrpcClient({
		baseUrl: getProviderUrl(network, input.providerUrl),
		network,
	});
	const client = rawClient.$extend(
		suigar({
			config: input.config as SuigarConfigOverrides | undefined,
			partner: input.partner,
		}),
	);

	return {
		client: client as SuigarClientBundle['client'],
		rawClient,
		config: {
			network,
			providerUrl: getProviderUrl(network, input.providerUrl),
			sdk: client.suigar.getConfig(),
		} satisfies ResolvedMcpConfig,
	};
};

export const resolveDefaultCoinType = (
	config: ResolvedMcpConfig,
	coinType?: string,
) => normalizeStructTag(coinType ?? config.sdk.coins.sui.coinType);

export const serializeTransactionToBase64 = async (
	transaction: Transaction,
	client: ReturnType<typeof createSuigarClient>['rawClient'],
) => toBase64(await transaction.build({ client }));

export const dryRunTransaction = async (
	transaction: Transaction,
	client: ReturnType<typeof createSuigarClient>['rawClient'],
) =>
	client.core.simulateTransaction({
		transaction,
		include: {
			effects: true,
			events: true,
			balanceChanges: true,
		},
	});

export const summarizeTransaction = (
	transaction: Transaction,
	context: {
		game?: SupportedGameId;
		action?: 'create' | 'join' | 'cancel';
		coinType?: string;
		stake?: bigint | number;
	} = {},
): TransactionSummary => {
	const data = transaction.getData() as {
		sender?: string | null;
		gasData?: {
			budget?: string | number | bigint | null;
			price?: string | number | bigint | null;
		};
		commands?: Array<Record<string, unknown> & { $kind?: string }>;
		inputs?: Array<{
			$kind?: string;
			UnresolvedObject?: { objectId?: string } | null;
		}>;
	};

	const commands = (data.commands ?? []).map((command) => {
		const kind = String(command.$kind ?? Object.keys(command)[0] ?? 'Unknown');
		const moveCall = (
			command as {
				MoveCall?: {
					package?: string;
					module?: string;
					function?: string;
					typeArguments?: string[];
				};
			}
		).MoveCall;
		return {
			kind,
			target:
				moveCall?.package && moveCall?.module && moveCall?.function
					? `${moveCall.package}::${moveCall.module}::${moveCall.function}`
					: undefined,
			typeArguments: moveCall?.typeArguments,
		};
	});

	const objectInputs = (data.inputs ?? []).flatMap((input) =>
		input.$kind === 'UnresolvedObject' && input.UnresolvedObject?.objectId
			? [input.UnresolvedObject.objectId]
			: [],
	);

	return {
		sender: data.sender ?? null,
		gasBudget:
			data.gasData?.budget == null ? null : String(data.gasData.budget),
		gasPrice: data.gasData?.price == null ? null : String(data.gasData.price),
		commandCount: commands.length,
		commands,
		inputs: data.inputs?.length ?? 0,
		objectInputs,
		game: context.game,
		action: context.action,
		coinType: context.coinType
			? normalizeStructTag(context.coinType)
			: undefined,
		stake: context.stake == null ? undefined : String(context.stake),
	};
};

export const buildTransactionResult = async ({
	mode,
	transaction,
	config,
	client,
	context,
}: {
	mode: Exclude<BuilderMode, 'read-only'>;
	transaction: Transaction;
	config: ResolvedMcpConfig;
	client: ReturnType<typeof createSuigarClient>['rawClient'];
	context: Parameters<typeof summarizeTransaction>[1];
}): Promise<BuildTransactionResult> => {
	const summary = summarizeTransaction(transaction, context);
	if (mode === 'dry-run') {
		return {
			mode,
			network: config.network,
			config,
			summary,
			dryRun: await dryRunTransaction(transaction, client),
		};
	}

	return {
		mode,
		network: config.network,
		config,
		summary,
		transactionBytesBase64: await serializeTransactionToBase64(
			transaction,
			client,
		),
	};
};
