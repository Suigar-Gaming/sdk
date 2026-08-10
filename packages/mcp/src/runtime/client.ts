// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ClientWithExtensions } from '@mysten/sui/client';
import type { Signer } from '@mysten/sui/cryptography';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import type { Transaction } from '@mysten/sui/transactions';
import {
	isValidSuiAddress,
	isValidSuiNSName,
	normalizeStructTag,
	normalizeSuiAddress,
	normalizeSuiNSName,
	SUI_DECIMALS,
} from '@mysten/sui/utils';
import { suigar, type SuigarClient, type SuigarNetwork } from '@suigar/sdk';
import { formatBaseUnitAmount } from '../utils/index.js';
import { readPersistedDefaultNetwork } from '../wallet/credentials.js';
import {
	extractDryRunErrors,
	summarizeDryRun,
	toJsonValue,
} from './dry-run.js';
import type {
	BuilderMode,
	BuildTransactionResult,
	DryRunResult,
	McpConfig,
	RawDryRunResult,
	SuigarMcpConfigInput,
	TransactionSummary,
	TransactionSummaryContext,
} from './types.js';

const DEFAULT_PROVIDER_URLS = {
	mainnet: 'https://fullnode.mainnet.sui.io:443',
	testnet: 'https://fullnode.testnet.sui.io:443',
} as const satisfies Record<SuigarNetwork, string>;

export const DEFAULT_NETWORK: SuigarNetwork = 'testnet';

export function normalizeNetwork(network?: string): SuigarNetwork {
	const resolvedNetwork = network ?? readPersistedDefaultNetwork();
	if (resolvedNetwork === 'mainnet' || resolvedNetwork === 'testnet') {
		return resolvedNetwork;
	}

	throw new RangeError(
		`Unsupported network: ${resolvedNetwork}. Use "mainnet" or "testnet".`,
	);
}

export function getProviderUrl(
	network: SuigarNetwork,
	providerUrl?: string,
): string {
	return providerUrl ?? DEFAULT_PROVIDER_URLS[network];
}

export type SuigarClientBundle = {
	client: ClientWithExtensions<
		{
			suigar: SuigarClient;
		},
		SuiGrpcClient
	>;
	config: McpConfig;
	resolveSuiNSName(name: string): Promise<string | null>;
};

export function createSuigarClient(
	input: SuigarMcpConfigInput = {},
): SuigarClientBundle {
	const network = normalizeNetwork(input.network);
	const providerUrl = getProviderUrl(network, input.providerUrl);
	const baseClient = new SuiGrpcClient({
		baseUrl: providerUrl,
		network,
	});
	const client = baseClient.$extend(
		suigar({
			config: input.config,
			partner: input.partner,
		}),
	);

	return {
		client,
		config: {
			network,
			providerUrl,
			sdk: client.suigar.getConfig(),
		} satisfies McpConfig,
		resolveSuiNSName: async (name) =>
			(
				await baseClient.nameService.lookupName({
					name,
				})
			).response.record?.targetAddress ?? null,
	};
}

export function resolveDefaultCoinType(
	config: McpConfig,
	coinType?: string,
): string {
	return normalizeStructTag(coinType ?? config.sdk.coins.sui.coinType);
}

export async function resolveOwnerAddress(
	owner: string,
	bundle: SuigarClientBundle,
): Promise<string> {
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
}

async function dryRunTransaction(
	transaction: Transaction,
	client: SuigarClientBundle['client'],
): Promise<RawDryRunResult> {
	return client.core.simulateTransaction({
		transaction,
		include: {
			effects: true,
			events: true,
			balanceChanges: true,
		},
	});
}

function summarizeTransaction(
	transaction: Transaction,
	context: TransactionSummaryContext = {},
): TransactionSummary {
	const data = transaction.getData();

	const commands = (data.commands ?? []).map((command) => {
		const kind = String(command.$kind ?? Object.keys(command)[0] ?? 'Unknown');
		const moveCall = command.MoveCall;
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

	const objectInputs: Array<string> = [];
	for (const input of data.inputs ?? []) {
		if (
			input.$kind === 'UnresolvedObject' &&
			input.UnresolvedObject?.objectId
		) {
			objectInputs.push(input.UnresolvedObject.objectId);
		}
	}

	return {
		sender: data.sender ?? null,
		gasBudget:
			data.gasData?.budget == null ? null : String(data.gasData.budget),
		gasBudgetDisplay:
			data.gasData?.budget == null
				? null
				: formatBaseUnitAmount(data.gasData.budget, SUI_DECIMALS),
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
}

export async function buildTransactionResult({
	mode,
	transaction,
	config,
	client,
	context,
}: {
	mode: Exclude<BuilderMode, 'read-only' | 'execute'>;
	transaction: Transaction;
	config: McpConfig;
	client: SuigarClientBundle['client'];
	context: TransactionSummaryContext;
}): Promise<BuildTransactionResult> {
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
}

/** Sign and submit a transaction with a local session-wallet signer. */
export async function executeSessionTransaction({
	transaction,
	client,
	signer,
}: {
	transaction: Transaction;
	client: SuigarClientBundle['client'];
	signer: Signer;
}): Promise<{
	error?: string;
	address: string;
	digest: string;
	status: 'success' | 'failed';
}> {
	const result = await client.signAndExecuteTransaction({
		transaction,
		signer,
		include: { effects: true },
	});
	const executed =
		result.$kind === 'Transaction'
			? result.Transaction
			: result.FailedTransaction;
	const error = executed.status.error?.message;
	return {
		address: signer.toSuiAddress(),
		digest: executed.digest,
		status: executed.status.success
			? ('success' as const)
			: ('failed' as const),
		...(error ? { error } : {}),
	};
}
