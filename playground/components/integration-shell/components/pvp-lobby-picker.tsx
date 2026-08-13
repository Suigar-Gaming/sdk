'use client';

import { RefreshCw } from 'lucide-react';

import { CoinIcon } from '@/components/coins';
import { parseCoinKey, parseCoinTypeLabel } from '@/components/integration-shell/helpers/coin';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { compactAddress } from '@/lib/suigar-app';
import type { PvPCoinflipLobbyGame, SupportedCoinKey } from '@/lib/suigar-types';
import { cn } from '@/lib/utils';

type Props = {
	title: string;
	description: string;
	games: Array<PvPCoinflipLobbyGame>;
	selectedGameId: string;
	isLoading: boolean;
	error: string | null;
	emptyMessage: string;
	coinTypes: Record<SupportedCoinKey, string>;
	formatAmount: (amount: bigint, decimals: number) => string;
	getCoinDecimals: (coinType: string) => number;
	onRefresh: () => void;
	onSelectGame: (game: PvPCoinflipLobbyGame) => void;
};

export function PvPLobbyPicker({
	title,
	description,
	games,
	selectedGameId,
	isLoading,
	error,
	emptyMessage,
	coinTypes,
	formatAmount,
	getCoinDecimals,
	onRefresh,
	onSelectGame,
}: Props) {
	return (
		<Card className="bg-background/45">
			<CardHeader className="gap-3">
				<div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
					<div className="space-y-1">
						<CardTitle className="text-base">{title}</CardTitle>
						<CardDescription>{description}</CardDescription>
					</div>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-10 px-4 rounded-full"
						onClick={onRefresh}
						disabled={isLoading}
					>
						{isLoading ? (
							<Spinner data-icon="size-4 inline-start" />
						) : (
							<RefreshCw className="size-4" />
						)}
						Refresh
					</Button>
				</div>
			</CardHeader>
			<CardContent className="space-y-3">
				{error ? (
					<div className="text-sm px-4 py-3 border-destructive/40 bg-destructive/10 text-destructive rounded-2xl border">
						{error}
					</div>
				) : null}

				{!error && games.length === 0 && !isLoading ? (
					<div className="text-sm px-4 py-5 border-dashed border-border/70 bg-background/50 text-muted-foreground rounded-2xl border">
						{emptyMessage}
					</div>
				) : null}

				{games.length > 0 ? (
					<div className="grid md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2">
						{games.map((game) => {
							const creatorSide = game.creator_is_tails ? 'tails' : 'heads';
							const amount = formatAmount(
								BigInt(game.stake_per_player),
								getCoinDecimals(game.coin_type),
							);
							const coinKey = parseCoinKey(game.coin_type, coinTypes);
							const coinLabel = parseCoinTypeLabel(game.coin_type, coinTypes);

							return (
								<div
									key={game.id}
									className={cn(
										'relative w-full px-2.5 py-2.5 text-left rounded-2xl border transition-colors',
										selectedGameId === game.id
											? 'border-secondary/60 bg-secondary/10 shadow-[0_18px_45px_-38px_rgba(8,47,91,0.5)]'
											: 'border-border/70 bg-card/75 hover:border-secondary/40 hover:bg-secondary/5',
									)}
								>
									<Button
										type="button"
										variant="ghost"
										onClick={() => onSelectGame(game)}
										className="absolute inset-0 z-0 h-auto w-auto rounded-2xl border-0 bg-transparent p-0 hover:bg-transparent active:translate-y-0 focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
										aria-label={`Select PvP lobby ${compactAddress(game.id)}`}
									/>
									<div className="pointer-events-none relative z-10 flex flex-col gap-2">
										<div className="flex items-start justify-between gap-3">
											<div className="min-w-0 space-y-1">
												<p className="text-sm uppercase text-muted-foreground">Amount</p>
												<div className="flex min-w-0 items-center whitespace-nowrap text-sm font-semibold tabular-nums gap-1 text-foreground">
													<span className="min-w-0 truncate">{amount}</span>
													<span className="inline-flex shrink-0 items-center font-medium gap-1 text-xs text-muted-foreground">
														{coinKey ? (
															<CoinIcon coinKey={coinKey} className="size-3.5 shrink-0" />
														) : null}
														{coinLabel}
													</span>
												</div>
											</div>
											<Badge
												variant={game.is_private ? 'destructive' : 'success'}
												className="mr-1 uppercase"
											>
												{game.is_private ? 'Private' : 'Public'}
											</Badge>
										</div>

										<div className="flex items-center justify-between gap-3">
											<div className="space-y-1">
												<p className="text-xs uppercase text-muted-foreground">Creator side</p>
												<p className="text-xs font-medium capitalize text-foreground">
													{creatorSide}
												</p>
											</div>
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
