// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { ClientWithExtensions } from '@mysten/sui/client';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import type { Transaction } from '@mysten/sui/transactions';
import {
	isValidSuiAddress,
	isValidSuiNSName,
	normalizeStructTag,
	normalizeSuiAddress,
	normalizeSuiNSName,
} from '@mysten/sui/utils';
import { suigar, type SuigarClient, type SuigarNetwork } from '@suigar/sdk';
import type { Game, PvPCoinflipAction } from '@suigar/sdk/games';
import {
	extractDryRunErrors,
	summarizeDryRun,
	toJsonValue,
} from './dry-run.js';
import { formatBaseUnitAmount } from './format.js';
import type {
	BuilderMode,
	BuildTransactionResult,
	DryRunResult,
	JsonValue,
	RawDryRunResult,
	ResolvedMcpConfig,
	SuigarConfigOverrides,
	SuigarMcpConfigInput,
	TransactionSummary,
} from './types.js';

const DEFAULT_PROVIDER_URLS = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
} as const satisfies Record<SuigarNetwork, string>;

const DEFAULT_NETWORK: SuigarNetwork = 'testnet';

export const normalizeNetwork = (
	network: string | undefined = DEFAULT_NETWORK,
): SuigarNetwork => {
	if (network === 'mainnet' || network === 'testnet') {
		return network;
	}

	throw new RangeError(
		`Unsupported network: ${network}. Use "mainnet" or "testnet".`,
	);
};

export const getProviderUrl = (network: SuigarNetwork, providerUrl?: string) =>
	providerUrl ?? DEFAULT_PROVIDER_URLS[network];

export type SuigarClientBundle = {
	client: ClientWithExtensions<
		{
			suigar: SuigarClient;
		},
		SuiGrpcClient
	>;
	config: ResolvedMcpConfig;
	resolveSuiNSName(name: string): Promise<string | null>;
};

export const createSuigarClient = (
	input: SuigarMcpConfigInput = {},
): SuigarClientBundle => {
	const network = normalizeNetwork(input.network);
	const baseClient = new SuiGrpcClient({
		baseUrl: getProviderUrl(network, input.providerUrl),
		network,
	});
	const client = baseClient.$extend(
		suigar({
			config: input.config as SuigarConfigOverrides | undefined,
			partner: input.partner,
		}),
	);

	return {
		client,
		config: {
			network,
			providerUrl: getProviderUrl(network, input.providerUrl),
			sdk: client.suigar.getConfig(),
		} satisfies ResolvedMcpConfig,
		resolveSuiNSName: async (name) =>
			(
				await baseClient.nameService.lookupName({
					name,
				})
			).response.record?.targetAddress ?? null,
	};
};

export const resolveDefaultCoinType = (
	config: ResolvedMcpConfig,
	coinType?: string,
) => normalizeStructTag(coinType ?? config.sdk.coins.sui.coinType);

export const resolveOwnerAddress = async (
	owner: string,
	bundle: SuigarClientBundle,
): Promise<string> => {
	try {
		const normalizedAddress = normalizeSuiAddress(owner);
		if (isValidSuiAddress(normalizedAddress)) {
			return normalizedAddress;
		}
	} catch {
		// Fall through to SuiNS validation.
	}

	if (!isValidSuiNSName(owner)) {
		throw new TypeError(
			'owner must be a valid Sui address or SuiNS name such as name.sui or sub.name.sui.',
		);
	}

	const normalizedName = normalizeSuiNSName(owner, 'dot');
	const resolvedAddress = await bundle.resolveSuiNSName(normalizedName);
	if (!resolvedAddress) {
		throw new Error(
			`SuiNS name ${normalizedName} did not resolve to an address.`,
		);
	}

	return normalizeSuiAddress(resolvedAddress);
};

const dryRunTransaction = async (
	transaction: Transaction,
	client: ReturnType<typeof createSuigarClient>['client'],
): Promise<RawDryRunResult> =>
	client.core.simulateTransaction({
		transaction,
		include: {
			effects: true,
			events: true,
			balanceChanges: true,
		},
	});

const summarizeTransaction = (
	transaction: Transaction,
	context: {
		game?: Game;
		action?: PvPCoinflipAction;
		coinType?: string;
		stake?: bigint | number;
		stakeDisplay?: string;
		coinDecimals?: number;
		gameInputs?: Record<string, JsonValue>;
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
		const target =
			moveCall?.package && moveCall?.module && moveCall?.function
				? `${moveCall.package}::${moveCall.module}::${moveCall.function}`
				: undefined;
		return {
			kind,
			...(target ? { target } : {}),
			...(moveCall?.typeArguments
				? { typeArguments: moveCall.typeArguments }
				: {}),
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
		gasBudgetDisplay:
			data.gasData?.budget == null
				? null
				: formatBaseUnitAmount(data.gasData.budget, context.coinDecimals),
		gasPrice: data.gasData?.price == null ? null : String(data.gasData.price),
		commandCount: commands.length,
		commands,
		inputs: data.inputs?.length ?? 0,
		objectInputs,
		...(context.game ? { game: context.game } : {}),
		...(context.action ? { action: context.action } : {}),
		...(context.coinType
			? { coinType: normalizeStructTag(context.coinType) }
			: {}),
		...(context.stake == null ? {} : { stake: String(context.stake) }),
		...(context.stakeDisplay ? { stakeDisplay: context.stakeDisplay } : {}),
		...(context.coinDecimals == null
			? {}
			: { coinDecimals: context.coinDecimals }),
		...(context.gameInputs ? { gameInputs: context.gameInputs } : {}),
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
	client: ReturnType<typeof createSuigarClient>['client'];
	context: Parameters<typeof summarizeTransaction>[1];
}): Promise<BuildTransactionResult> => {
	const summary = summarizeTransaction(transaction, context);
	if (mode === 'dry-run') {
		const rawDryRun = await dryRunTransaction(transaction, client);
		const dryRun = toJsonValue(rawDryRun) as DryRunResult;
		const dryRunSummary = summarizeDryRun(rawDryRun, client, context);
		const errors = extractDryRunErrors(rawDryRun);
		return {
			mode,
			network: config.network,
			config,
			summary,
			dryRun,
			dryRunSummary,
			...(errors.length > 0 ? { errors } : {}),
		};
	}

	return {
		mode,
		network: config.network,
		config,
		summary,
		transactionBytesBase64:
			await client.suigar.serializeTransactionToBase64(transaction),
	};
};
