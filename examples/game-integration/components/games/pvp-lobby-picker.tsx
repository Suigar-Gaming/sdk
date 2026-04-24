'use client';

import * as React from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { compactAddress } from '@/lib/suigar-app';
import type {
	PvPCoinflipLobbyGame,
	SupportedCoinKey,
} from '@/lib/suigar-types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

type Props = {
	title: string;
	description: string;
	games: PvPCoinflipLobbyGame[];
	selectedGameId: string;
	isLoading: boolean;
	error: string | null;
	isWalletConnected: boolean;
	coinTypes: Record<SupportedCoinKey, string>;
	formatAmount: (amount: bigint, decimals: number) => string;
	getCoinDecimals: (coinType: string) => number;
	onRefresh: () => void;
	onSelectGame: (game: PvPCoinflipLobbyGame) => void;
};

function parseCoinTypeLabel(
	coinType: string,
	coinTypes: Record<SupportedCoinKey, string>,
) {
	const matchingEntry = (
		Object.entries(coinTypes) as Array<[SupportedCoinKey, string]>
	).find(([, configuredCoinType]) => configuredCoinType === coinType);

	if (matchingEntry) {
		return matchingEntry[0].toUpperCase();
	}

	const segments = coinType.split('::');
	return segments[segments.length - 1] ?? coinType;
}

export function PvPLobbyPicker({
	title,
	description,
	games,
	selectedGameId,
	isLoading,
	error,
	isWalletConnected,
	coinTypes,
	formatAmount,
	getCoinDecimals,
	onRefresh,
	onSelectGame,
}: Props) {
	function handleSelect(game: PvPCoinflipLobbyGame) {
		onSelectGame(game);
	}

	async function handleCopyGameId(
		event: React.MouseEvent<HTMLButtonElement>,
		gameId: string,
	) {
		event.stopPropagation();

		try {
			await navigator.clipboard.writeText(gameId);
			toast.success('Copied game id', {
				description: gameId,
			});
		} catch {
			toast.error('Unable to copy game id');
		}
	}

	return (
		<Card className="border-border/70 bg-background/45">
			<CardHeader className="gap-3">
				<div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
					<div className="space-y-1">
						<CardTitle className="text-base">{title}</CardTitle>
						<CardDescription>{description}</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="rounded-full"
						onClick={onRefresh}
						disabled={isLoading}
					>
						<RefreshCw className={cn('size-4', isLoading && 'animate-spin')} />
						Refresh
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{!isWalletConnected ? (
					<div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-5 text-sm text-muted-foreground">
						Connect a wallet to load the unresolved PvP lobbies for this action.
					</div>
				) : null}

				{isWalletConnected && error ? (
					<div className="rounded-2xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				) : null}

				{isWalletConnected && !error && games.length === 0 && !isLoading ? (
					<div className="rounded-2xl border border-dashed border-border/70 bg-background/50 px-4 py-5 text-sm text-muted-foreground">
						No matching unresolved PvP lobbies were found.
					</div>
				) : null}

				{isWalletConnected && games.length > 0 ? (
					<div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
						{games.map((game) => {
							const creatorSide = game.creator_is_tails ? 'tails' : 'heads';
							const amount = formatAmount(
								BigInt(game.stake_per_player),
								getCoinDecimals(game.coinType),
							);
							const coinLabel = parseCoinTypeLabel(game.coinType, coinTypes);

							return (
								<div
									key={game.id}
									role="button"
									tabIndex={0}
									onClick={() => handleSelect(game)}
									onKeyDown={(event) => {
										if (event.key === 'Enter' || event.key === ' ') {
											event.preventDefault();
											handleSelect(game);
										}
									}}
									className={cn(
										'w-full rounded-2xl border px-2.5 py-2.5 text-left transition-colors',
										'cursor-pointer focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none',
										selectedGameId === game.id
											? 'border-secondary/60 bg-secondary/10 shadow-[0_18px_45px_-38px_rgba(8,47,91,0.5)]'
											: 'border-border/70 bg-card/75 hover:border-secondary/40 hover:bg-secondary/5',
									)}
								>
									<div className="flex flex-col gap-2">
										<div className="flex items-start justify-between gap-3">
											<div className="space-y-1">
												<p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
													Amount
												</p>
												<p className="text-sm font-semibold tabular-nums text-foreground">
													{amount}{' '}
													<span className="text-[0.68rem] font-medium text-muted-foreground">
														{coinLabel}
													</span>
												</p>
											</div>
											<div
												className={cn(
													'rounded-full border px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.14em]',
													game.is_private
														? 'border-destructive/45 bg-destructive/10 text-destructive'
														: 'border-success/45 bg-success/12 text-success',
												)}
											>
												{game.is_private ? 'Private' : 'Public'}
											</div>
										</div>

										<div className="flex items-center justify-between gap-3">
											<div className="space-y-1">
												<p className="text-[0.65rem] uppercase tracking-[0.16em] text-muted-foreground">
													Creator side
												</p>
												<p className="text-xs font-medium capitalize text-foreground">
													{creatorSide}
												</p>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="sm"
												className="h-7 rounded-full px-2 text-[0.68rem] text-muted-foreground"
												onClick={(event) => handleCopyGameId(event, game.id)}
											>
												<Copy className="size-3.5" />
												{compactAddress(game.id)}
											</Button>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
