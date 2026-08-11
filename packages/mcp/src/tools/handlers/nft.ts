// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	buildTransactionResult,
	createSuigarClient,
	resolveOwnerAddress,
	type NftV1MintReadOnlyPlan,
	type ToolTextResult,
} from '../../runtime/index.js';
import { createExecutionBridge, resolveWebOrigin } from '../../wallet/index.js';
import type { BuildNftV1MintTransactionInput } from '../schemas/index.js';
import {
	asTextResponse,
	getConfigInput,
	getMode,
	requireString,
} from './shared.js';

export async function buildNftV1MintTransactionTool(
	input: BuildNftV1MintTransactionInput = {},
): Promise<ToolTextResult> {
	const mode = getMode(input.mode);
	const { config } = createSuigarClient(getConfigInput(input));

	if (mode === 'read-only') {
		return asTextResponse({
			mode,
			network: config.network,
			config,
			plan: {
				target: `${config.sdk.packageIds.nftV1}::nft::mint_to_sender`,
				typeArguments: [],
				requiredInputs: ['owner', 'specId'],
				notes: [
					'Resolves the selected specification price from the configured NFT V1 factory when the transaction is built.',
				],
			},
			nft: {
				packageId: config.sdk.packageIds.nftV1,
				factoryId: config.sdk.objectIds.nftV1Factory,
			},
		} satisfies NftV1MintReadOnlyPlan);
	}

	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(
		requireString(input.owner, 'owner'),
		bundle,
	);
	const specId = requireString(input.specId, 'specId');
	const coin = bundle.config.sdk.coins.sui;
	const transaction = bundle.client.suigar.tx.nftV1.mint({
		owner,
		specId,
		gasBudget: input.gasBudget,
		useGasCoin: input.useGasCoin,
	});
	const context = {
		coinType: coin.coinType,
		coinDecimals: coin.decimals,
		gameInputs: { nftSpecId: specId },
	};

	if (mode === 'execute') {
		const built = await buildTransactionResult({
			mode: 'build',
			transaction,
			config: bundle.config,
			client: bundle.client,
			context,
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
			mode,
			transaction,
			config: bundle.config,
			client: bundle.client,
			context,
		}),
	);
}
