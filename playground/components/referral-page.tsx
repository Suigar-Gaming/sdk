'use client';

import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react';
import { FileCode2, RefreshCw, SendHorizontal } from 'lucide-react';
import * as React from 'react';
import { AppHeader } from '@/components/app-header';
import { CodeBlock } from '@/components/code-block';
import { CoinIcon } from '@/components/coins';
import { formatBalance } from '@/components/integration-shell/helpers/coin';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { dAppKit } from '@/lib/dapp-kit';
import type { SupportedCoinKey } from '@/lib/suigar-types';

type ClaimKind = 'commission-sui' | 'commission-usdc' | 'level-up';

type ClaimState = {
	amount: bigint | null;
	error: string | null;
};

const INITIAL_CLAIM_STATE: ClaimState = { amount: null, error: null };

function getErrorMessage(error: unknown) {
	return error instanceof Error ? error.message : String(error);
}

export function ReferralPage() {
	const client = useCurrentClient();
	const account = useCurrentAccount();
	const owner = account?.address;
	const [claims, setClaims] = React.useState<Record<ClaimKind, ClaimState>>({
		'commission-sui': INITIAL_CLAIM_STATE,
		'commission-usdc': INITIAL_CLAIM_STATE,
		'level-up': INITIAL_CLAIM_STATE,
	});
	const [isLoading, setIsLoading] = React.useState(false);
	const [isExecuting, setIsExecuting] = React.useState<ClaimKind | null>(null);
	const [status, setStatus] = React.useState<string | null>(null);

	const refreshClaims = React.useCallback(async () => {
		if (!owner) {
			setClaims({
				'commission-sui': INITIAL_CLAIM_STATE,
				'commission-usdc': INITIAL_CLAIM_STATE,
				'level-up': INITIAL_CLAIM_STATE,
			});
			return;
		}

		setIsLoading(true);
		setStatus(null);
		try {
			const { sui, usdc } = client.suigar.getConfig().coins;
			const results = await Promise.allSettled([
				client.suigar.view.referral.getCommission({
					owner,
					coinType: sui.coinType,
				}),
				client.suigar.view.referral.getCommission({
					owner,
					coinType: usdc.coinType,
				}),
				client.suigar.view.referral.getLevelUpUsdRewards({ owner }),
			]);

			const toClaimState = (result: (typeof results)[number]): ClaimState =>
				result.status === 'fulfilled'
					? { amount: result.value, error: null }
					: { amount: null, error: getErrorMessage(result.reason) };

			setClaims({
				'commission-sui': toClaimState(results[0]),
				'commission-usdc': toClaimState(results[1]),
				'level-up': toClaimState(results[2]),
			});
		} catch (error) {
			const message = getErrorMessage(error);
			setClaims({
				'commission-sui': { amount: null, error: message },
				'commission-usdc': { amount: null, error: message },
				'level-up': { amount: null, error: message },
			});
		} finally {
			setIsLoading(false);
		}
	}, [client, owner]);

	React.useEffect(() => {
		void refreshClaims();
	}, [refreshClaims]);

	const executeClaim = async (kind: ClaimKind) => {
		if (!owner) return;

		setIsExecuting(kind);
		setStatus(null);
		try {
			const { sui, usdc } = client.suigar.getConfig().coins;
			const transaction =
				kind === 'commission-sui'
					? client.suigar.tx.referral.claimCommission({
							owner,
							coinType: sui.coinType,
						})
					: kind === 'commission-usdc'
						? client.suigar.tx.referral.claimCommission({
								owner,
								coinType: usdc.coinType,
							})
						: client.suigar.tx.referral.claimLevelUpUsdRewards({ owner });
			const execution = await dAppKit.signAndExecuteTransaction({
				transaction,
			});

			if (execution.$kind === 'FailedTransaction') {
				throw new Error(execution.FailedTransaction.status.error?.message);
			}

			setStatus(execution.Transaction.digest);
			await refreshClaims();
		} catch (error) {
			setClaims((current) => ({
				...current,
				[kind]: { ...current[kind], error: getErrorMessage(error) },
			}));
		} finally {
			setIsExecuting(null);
		}
	};

	const { sui, usdc } = client.suigar.getConfig().coins;
	const referralCode = `const { sui, usdc } = client.suigar.getConfig().coins;
const owner = '${owner ?? '<wallet address>'}';

const [suiCommission, usdcCommission, levelUpUsdRewards] = await Promise.all([
  client.suigar.view.referral.getCommission({ owner, coinType: sui.coinType }),
  client.suigar.view.referral.getCommission({ owner, coinType: usdc.coinType }),
  client.suigar.view.referral.getLevelUpUsdRewards({ owner }),
]);

const commissionTx = client.suigar.tx.referral.claimCommission({
  owner,
  coinType: sui.coinType,
});
const levelUpTx = client.suigar.tx.referral.claimLevelUpUsdRewards({ owner });

await dAppKit.signAndExecuteTransaction({ transaction: commissionTx });`;
	const claimCards: Array<{
		kind: ClaimKind;
		title: string;
		description: string;
		coin: string;
		coinKey: SupportedCoinKey;
		decimals: number;
	}> = [
		{
			kind: 'commission-sui',
			title: 'SUI commission',
			description: 'Referral commission earned from SUI wagers.',
			coin: 'SUI',
			coinKey: 'sui',
			decimals: sui.decimals,
		},
		{
			kind: 'commission-usdc',
			title: 'USDC commission',
			description: 'Referral commission earned from USDC wagers.',
			coin: 'USDC',
			coinKey: 'usdc',
			decimals: usdc.decimals,
		},
		{
			kind: 'level-up',
			title: 'Level-up rewards',
			description: 'USD referral level-up rewards paid in USDC.',
			coin: 'USDC',
			coinKey: 'usdc',
			decimals: usdc.decimals,
		},
	];

	return (
		<div className="min-h-dvh">
			<div className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5 md:pt-4 lg:px-8">
				<div className="mx-auto max-w-[1500px]">
					<AppHeader />
				</div>
			</div>

			<main className="mx-auto mt-2 w-full max-w-[1500px] px-3 pb-8 pt-20 md:px-5 md:pt-24 lg:px-8">
				<section className="mb-6 rounded-4xl border border-border/70 bg-card/80 p-6 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h1 className="text-2xl leading-none md:text-4xl xl:text-5xl">
								Suigar Rewards Claim
							</h1>
							<p className="mt-3 max-w-2xl text-muted-foreground">
								Amounts are simulated from the current on-chain referral state before you sign a
								claim.
							</p>
						</div>
						<div className="flex gap-2">
							<Dialog>
								<DialogTrigger asChild>
									<Button variant="outline">
										<FileCode2 />
										View code
									</Button>
								</DialogTrigger>
								<DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto" size="xl">
									<DialogHeader>
										<DialogTitle className="text-xl md:text-2xl">Referral code</DialogTitle>
										<DialogDescription>
											The preview shows the simulated reward reads and the unsigned SDK claim
											builders used by this page.
										</DialogDescription>
									</DialogHeader>
									<CodeBlock
										code={referralCode}
										copyDescription="The referral code was copied."
										copyTitle="Copy referral code"
										copyMode="icon"
									/>
								</DialogContent>
							</Dialog>
							<Button
								variant="outline"
								onClick={() => void refreshClaims()}
								disabled={!owner || isLoading}
							>
								<RefreshCw className={isLoading ? 'animate-spin' : undefined} />
								Refresh
							</Button>
						</div>
					</div>
				</section>

				{status ? (
					<Alert variant="success" className="mb-6">
						<SendHorizontal />
						<AlertTitle>Claim submitted</AlertTitle>
						<AlertDescription className="font-mono text-xs break-all">{status}</AlertDescription>
					</Alert>
				) : null}

				<div className="grid gap-4 md:grid-cols-3">
					{claimCards.map((card) => {
						const claim = claims[card.kind];
						const amount = claim.amount === null ? '—' : formatBalance(claim.amount, card.decimals);
						return (
							<Card key={card.kind}>
								<CardHeader>
									<div className="flex items-center justify-between gap-3">
										<CardTitle>{card.title}</CardTitle>
										<Badge variant="outline" className="gap-1.5">
											<CoinIcon coinKey={card.coinKey} className="size-4" />
											{card.coin}
										</Badge>
									</div>
									<CardDescription>{card.description}</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div>
										<p className="text-sm text-muted-foreground">Claimable now</p>
										{isLoading ? (
											<Skeleton className="mt-2 h-9 w-32" />
										) : (
											<p className="mt-1 text-3xl font-semibold tracking-tight">
												{amount} {card.coin}
											</p>
										)}
									</div>
									{claim.error ? <p className="text-sm text-destructive">{claim.error}</p> : null}
									<Button
										className="w-full"
										disabled={
											!owner ||
											isLoading ||
											isExecuting !== null ||
											claim.amount === null ||
											claim.amount === BigInt(0)
										}
										onClick={() => void executeClaim(card.kind)}
									>
										<SendHorizontal />
										{isExecuting === card.kind ? 'Claiming…' : 'Claim'}
									</Button>
								</CardContent>
							</Card>
						);
					})}
				</div>
			</main>
		</div>
	);
}
