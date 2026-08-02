import {
	buildTransactionResult,
	createSuigarClient,
	resolveOwnerAddress,
	type ReferralClaimKind,
	type ReferralClaimReadOnlyPlan,
	type ReferralClaimReadResult,
} from '../../runtime/index.js';
import { formatBaseUnitAmount } from '../../utils/index.js';
import {
	createExecutionBridge,
	resolveFrontendOrigin,
} from '../../wallet/index.js';
import type {
	BuildReferralCommissionClaimTransactionInput,
	BuildReferralLevelUpUsdRewardsClaimTransactionInput,
	GetReferralCommissionInput,
	GetReferralLevelUpUsdRewardsInput,
} from '../schemas/index.js';
import {
	asTextResponse,
	coinMetadataForAmount,
	getConfigInput,
	getMode,
	referralClaimTarget,
	requireString,
} from './shared.js';

const referralClaimReadResult = async ({
	input,
	kind,
}: {
	input:
		| Partial<GetReferralCommissionInput>
		| Partial<GetReferralLevelUpUsdRewardsInput>;
	kind: ReferralClaimKind;
}) => {
	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(
		requireString(input.owner, 'owner'),
		bundle,
	);
	const coin =
		kind === 'commission' && 'coinType' in input
			? coinMetadataForAmount(bundle.config, input.coinType)
			: bundle.config.sdk.coins.usdc;
	const amount =
		kind === 'commission'
			? await bundle.client.suigar.view.referral.getCommission({
					owner,
					coinType: coin.coinType,
				})
			: await bundle.client.suigar.view.referral.getLevelUpUsdRewards({
					owner,
				});

	return asTextResponse({
		network: bundle.config.network,
		config: bundle.config,
		owner,
		referral: {
			kind,
			coinType: coin.coinType,
			amount: amount.toString(),
			amountDisplay: formatBaseUnitAmount(amount, coin.decimals),
			notes: [
				'Amount is simulated with the SDK claim transaction and is not a signed or executed claim.',
			],
		},
	} satisfies ReferralClaimReadResult);
};

export const getReferralCommissionTool = async (
	input: Partial<GetReferralCommissionInput> = {},
) => referralClaimReadResult({ input, kind: 'commission' });

export const getReferralLevelUpUsdRewardsTool = async (
	input: Partial<GetReferralLevelUpUsdRewardsInput> = {},
) => referralClaimReadResult({ input, kind: 'level-up-usd-rewards' });

const referralReadOnlyPlan = ({
	input,
	kind,
}: {
	input:
		| BuildReferralCommissionClaimTransactionInput
		| BuildReferralLevelUpUsdRewardsClaimTransactionInput;
	kind: ReferralClaimKind;
}) => {
	const { config } = createSuigarClient(getConfigInput(input));
	const coin =
		kind === 'commission' && 'coinType' in input
			? coinMetadataForAmount(config, input.coinType)
			: config.sdk.coins.usdc;
	const plan = {
		target: referralClaimTarget(config, kind),
		typeArguments: [coin.coinType],
		requiredInputs: ['owner'],
		notes: [
			'Builds an unsigned referral claim transaction; the returned coin is transferred to the owner by the SDK.',
		],
	};
	return asTextResponse({
		mode: 'read-only',
		network: config.network,
		config,
		plan,
		referral: {
			kind,
			coinType: coin.coinType,
			packageId: config.sdk.packageIds.referral,
		},
	} satisfies ReferralClaimReadOnlyPlan);
};

const buildReferralClaimTransactionTool = async ({
	input,
	kind,
}: {
	input:
		| BuildReferralCommissionClaimTransactionInput
		| BuildReferralLevelUpUsdRewardsClaimTransactionInput;
	kind: ReferralClaimKind;
}) => {
	const mode = getMode(input.mode);
	if (mode === 'read-only') {
		return referralReadOnlyPlan({ input, kind });
	}

	const bundle = createSuigarClient(getConfigInput(input));
	const owner = await resolveOwnerAddress(
		requireString(input.owner, 'owner'),
		bundle,
	);
	const coin =
		kind === 'commission' && 'coinType' in input
			? coinMetadataForAmount(bundle.config, input.coinType)
			: bundle.config.sdk.coins.usdc;
	const transaction =
		kind === 'commission'
			? bundle.client.suigar.tx.referral.claimCommission({
					owner,
					coinType: coin.coinType,
					gasBudget: input.gasBudget,
				})
			: bundle.client.suigar.tx.referral.claimLevelUpUsdRewards({
					owner,
					gasBudget: input.gasBudget,
				});
	if (mode === 'execute') {
		const built = await buildTransactionResult({
			mode: 'build',
			transaction,
			config: bundle.config,
			client: bundle.client,
			context: { coinType: coin.coinType, gameInputs: { referralClaim: kind } },
		});
		const execution = await createExecutionBridge({
			network: bundle.config.network,
			frontendOrigin: resolveFrontendOrigin(bundle.config.network),
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
			context: {
				coinType: coin.coinType,
				gameInputs: { referralClaim: kind },
			},
		}),
	);
};

export const buildReferralCommissionClaimTransactionTool = async (
	input: BuildReferralCommissionClaimTransactionInput = {},
) => buildReferralClaimTransactionTool({ input, kind: 'commission' });

export const buildReferralLevelUpUsdRewardsClaimTransactionTool = async (
	input: BuildReferralLevelUpUsdRewardsClaimTransactionInput = {},
) => buildReferralClaimTransactionTool({ input, kind: 'level-up-usd-rewards' });
