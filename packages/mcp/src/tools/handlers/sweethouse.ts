// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { Transaction } from '@mysten/sui/transactions';
import {
	buildTransactionResult,
	createSuigarClient,
	executeSessionTransaction,
	resolveDefaultCoinType,
	resolveOwnerAddress,
	type BuilderMode,
	type McpConfig,
	type SuigarClientBundle,
	type ToolTextResult,
	type TransactionSummaryContext,
} from '../../runtime/index.js';
import { toBaseUnits, toCurrencyAmountText } from '../../utils/index.js';
import {
	createExecutionBridge,
	loadSessionSigner,
	loadSessionWallet,
	resolveWebOrigin,
} from '../../wallet/index.js';
import type {
	BuildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInput,
	BuildSweetHouseDepositTransactionInput,
	BuildSweetHouseRedeemRequestTransactionInput,
} from '../schemas/index.js';
import {
	asTextResponse,
	coinMetadataForAmount,
	getConfigInput,
	getMode,
	getSuigarPackageId,
	requireString,
} from './shared.js';

type SweetHouseAction = 'deposit' | 'redeem-request' | 'claim-own-redeem-request-after-delay';
type SweetHouseInput =
	| BuildSweetHouseDepositTransactionInput
	| BuildSweetHouseRedeemRequestTransactionInput
	| BuildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInput;

function sweetHouseTarget(config: McpConfig, action: SweetHouseAction): string {
	const functionName =
		action === 'deposit'
			? 'deposit_public_pool_and_mint_staked_coins'
			: action === 'redeem-request'
				? 'redeem_request'
				: 'claim_own_redeem_request_after_delay';
	return `${getSuigarPackageId(config, 'core')}::sweethouse::${functionName}`;
}

function sweetHousePlan({
	input,
	action,
	requiredInputs,
	notes,
}: {
	input: SweetHouseInput;
	action: SweetHouseAction;
	requiredInputs: Array<string>;
	notes: Array<string>;
}): ToolTextResult {
	const { config } = createSuigarClient(getConfigInput(input));
	const coinType = resolveDefaultCoinType(config, input.coinType);
	return asTextResponse({
		mode: 'read-only',
		network: config.network,
		config,
		plan: {
			target: sweetHouseTarget(config, action),
			typeArguments: [coinType],
			requiredInputs,
			notes,
		},
		sweethouse: {
			action,
			coinType,
			packageId: getSuigarPackageId(config, 'core'),
			sweetHouseId: config.sdk.objectIds.sweetHouse,
		},
	});
}

async function resolveTransactionOwner(
	input: Pick<SweetHouseInput, 'mode' | 'executionWallet' | 'owner' | 'sessionWalletId'>,
	bundle: SuigarClientBundle,
): Promise<string> {
	const sessionExecution = getMode(input.mode) === 'execute' && input.executionWallet === 'session';
	if (sessionExecution) {
		const sessionWallet = await loadSessionWallet(input.sessionWalletId);
		if (!sessionWallet) {
			throw new Error(
				'No session wallet exists. Call "setup_session_wallet" first, then fund its address before executing SweetHouse transactions.',
			);
		}
		const sessionAddress = (await loadSessionSigner(input.sessionWalletId)).toSuiAddress();
		if (sessionWallet.address !== sessionAddress) {
			throw new Error(
				'The saved session wallet address does not match its keychain signer. Recover the intended wallet with "setup_session_wallet" before executing SweetHouse transactions.',
			);
		}
		if (input.owner) {
			const requestedOwner = await resolveOwnerAddress(input.owner, bundle);
			if (requestedOwner !== sessionAddress) {
				throw new RangeError(
					'owner must match the local session wallet address when executionWallet is "session".',
				);
			}
		}
		return sessionAddress;
	}

	return resolveOwnerAddress(requireString(input.owner, 'owner'), bundle);
}

async function buildSweetHouseTransactionTool({
	input,
	createTransaction,
	context,
}: {
	input: SweetHouseInput;
	createTransaction: (bundle: SuigarClientBundle) => Promise<Transaction>;
	context: (bundle: SuigarClientBundle) => TransactionSummaryContext;
}): Promise<ToolTextResult> {
	const mode = getMode(input.mode);
	if (mode === 'read-only') {
		throw new Error('read-only mode must be handled before transaction execution.');
	}

	const bundle = createSuigarClient(getConfigInput(input));
	const transaction = await createTransaction(bundle);
	const summaryContext = context(bundle);
	if (mode === 'execute') {
		if (input.executionWallet === 'session') {
			const built = await buildTransactionResult({
				mode: 'build',
				transaction,
				config: bundle.config,
				client: bundle.client,
				context: summaryContext,
			});
			const execution = await executeSessionTransaction({
				transaction,
				client: bundle.client,
				signer: await loadSessionSigner(input.sessionWalletId),
			});
			return asTextResponse({
				mode: 'execute',
				network: bundle.config.network,
				config: bundle.config,
				summary: built.summary,
				execution: { wallet: 'session', ...execution },
			});
		}
		const built = await buildTransactionResult({
			mode: 'build',
			transaction,
			config: bundle.config,
			client: bundle.client,
			context: summaryContext,
		});
		const execution = await createExecutionBridge({
			network: bundle.config.network,
			webOrigin: resolveWebOrigin(bundle.config.network),
			transactionBytesBase64: built.transactionBytesBase64 ?? '',
			summary: built.summary,
		});
		return asTextResponse({
			mode: 'execute',
			network: bundle.config.network,
			config: bundle.config,
			summary: built.summary,
			execution: { ...execution, status: 'pending' },
		});
	}

	return asTextResponse(
		await buildTransactionResult({
			mode: mode as Exclude<BuilderMode, 'read-only' | 'execute'>,
			transaction,
			config: bundle.config,
			client: bundle.client,
			context: summaryContext,
		}),
	);
}

function sweetHouseContext({
	bundle,
	coinType,
	action,
	amount,
	amountDisplay,
	requestId,
}: {
	bundle: SuigarClientBundle;
	coinType?: string;
	action: SweetHouseAction;
	amount?: bigint;
	amountDisplay?: string;
	requestId?: string;
}): TransactionSummaryContext {
	const coin = coinMetadataForAmount(bundle.config, coinType);
	return {
		coinType: coin.coinType,
		...(amount == null ? {} : { stake: amount, stakeDisplay: amountDisplay }),
		coinDecimals: coin.decimals,
		gameInputs: {
			sweetHouseAction: action,
			...(requestId ? { requestId } : {}),
		},
	};
}

export async function buildSweetHouseDepositTransactionTool(
	input: BuildSweetHouseDepositTransactionInput = {},
): Promise<ToolTextResult> {
	if (getMode(input.mode) === 'read-only') {
		return sweetHousePlan({
			input,
			action: 'deposit',
			requiredInputs: ['owner', 'amount'],
			notes: ['Deposits into the SweetHouse public pool and returns staked coins to owner.'],
		});
	}

	return buildSweetHouseTransactionTool({
		input,
		createTransaction: async (bundle) => {
			const coin = coinMetadataForAmount(bundle.config, input.coinType);
			return bundle.client.suigar.tx.sweetHouse.deposit({
				owner: await resolveTransactionOwner(input, bundle),
				coinType: coin.coinType,
				amount: toBaseUnits(input.amount, 'amount', coin.decimals),
				gasBudget: input.gasBudget,
				useGasCoin: input.useGasCoin,
			});
		},
		context: (bundle) => {
			const coin = coinMetadataForAmount(bundle.config, input.coinType);
			const amount = toBaseUnits(input.amount, 'amount', coin.decimals);
			return {
				...sweetHouseContext({
					bundle,
					coinType: input.coinType,
					action: 'deposit',
					amount,
					amountDisplay: toCurrencyAmountText(input.amount, 'amount'),
				}),
				gasBudget: input.gasBudget,
			};
		},
	});
}

export async function buildSweetHouseRedeemRequestTransactionTool(
	input: BuildSweetHouseRedeemRequestTransactionInput = {},
): Promise<ToolTextResult> {
	if (getMode(input.mode) === 'read-only') {
		return sweetHousePlan({
			input,
			action: 'redeem-request',
			requiredInputs: ['owner', 'amount'],
			notes: ['Creates a SweetHouse redeem request by spending staked coins from owner.'],
		});
	}

	return buildSweetHouseTransactionTool({
		input,
		createTransaction: async (bundle) => {
			const coin = coinMetadataForAmount(bundle.config, input.coinType);
			return bundle.client.suigar.tx.sweetHouse.redeemRequest({
				owner: await resolveTransactionOwner(input, bundle),
				coinType: coin.coinType,
				amount: toBaseUnits(input.amount, 'amount', coin.decimals),
				gasBudget: input.gasBudget,
			});
		},
		context: (bundle) => {
			const coin = coinMetadataForAmount(bundle.config, input.coinType);
			const amount = toBaseUnits(input.amount, 'amount', coin.decimals);
			return {
				...sweetHouseContext({
					bundle,
					coinType: input.coinType,
					action: 'redeem-request',
					amount,
					amountDisplay: toCurrencyAmountText(input.amount, 'amount'),
				}),
				gasBudget: input.gasBudget,
			};
		},
	});
}

export async function buildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionTool(
	input: BuildSweetHouseClaimOwnRedeemRequestAfterDelayTransactionInput = {},
): Promise<ToolTextResult> {
	if (getMode(input.mode) === 'read-only') {
		return sweetHousePlan({
			input,
			action: 'claim-own-redeem-request-after-delay',
			requiredInputs: ['owner', 'requestId'],
			notes: [
				'Claims a delayed redeem request. The signer must be the address that created the request.',
			],
		});
	}

	const requestId = requireString(input.requestId, 'requestId');
	return buildSweetHouseTransactionTool({
		input,
		createTransaction: async (bundle) => {
			const coinType = resolveDefaultCoinType(bundle.config, input.coinType);
			return bundle.client.suigar.tx.sweetHouse.claimOwnRedeemRequestAfterDelay({
				owner: await resolveTransactionOwner(input, bundle),
				coinType,
				requestId,
				gasBudget: input.gasBudget,
			});
		},
		context: (bundle) =>
			sweetHouseContext({
				bundle,
				coinType: input.coinType,
				action: 'claim-own-redeem-request-after-delay',
				requestId,
			}),
	});
}
