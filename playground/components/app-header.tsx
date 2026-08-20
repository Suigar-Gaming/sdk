'use client';

import { useCurrentAccount, useCurrentClient } from '@mysten/dapp-kit-react';
import { Menu } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { CoinSelectLabel } from '@/components/integration-shell/components/coin-select-label';
import {
	formatBalance,
	getCoinDisplayAmount,
	type CoinBalanceState,
} from '@/components/integration-shell/helpers/coin';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { withBasePath } from '@/lib/paths';
import type { SupportedCoinKey } from '@/lib/suigar-types';
import { cn } from '@/lib/utils';

const ConnectButton = dynamic(
	() =>
		import('@mysten/dapp-kit-react/ui').then((mod) => ({
			default: mod.ConnectButton,
		})),
	{
		ssr: false,
		loading: () => <Skeleton className="wallet-connect h-10 min-w-[9.5rem] rounded-full" />,
	},
);

const links = [
	{
		href: '/standard?game=coinflip',
		label: 'Games',
		isActive: (pathname: string) => pathname.endsWith('/standard') || pathname.endsWith('/pvp'),
	},
	{
		href: '/nft',
		label: 'NFTs',
		isActive: (pathname: string) => pathname.endsWith('/nft'),
	},
	{
		href: '/referral',
		label: 'Referral',
		isActive: (pathname: string) => pathname.endsWith('/referral'),
	},
] as const;

type HeaderProps = {
	selectedCoin?: SupportedCoinKey;
	onSelectedCoinChange?: (coin: SupportedCoinKey) => void;
	coinBalances?: Record<SupportedCoinKey, CoinBalanceState>;
	balanceOwner?: string | null;
};

export function AppHeader({
	selectedCoin,
	onSelectedCoinChange,
	coinBalances,
	balanceOwner,
}: HeaderProps) {
	const pathname = usePathname();
	const client = useCurrentClient();
	const account = useCurrentAccount();
	const activePathname = pathname.replace(/\/+$/, '');
	const coinEntries = React.useMemo(
		() =>
			Object.entries(client.suigar.getConfig().coins) as Array<
				[
					SupportedCoinKey,
					{
						coinType: string;
						decimals: number;
					},
				]
			>,
		[client],
	);
	const [localSelectedCoin, setLocalSelectedCoin] = React.useState<SupportedCoinKey>(
		coinEntries[0]?.[0] ?? 'sui',
	);
	const [localBalances, setLocalBalances] = React.useState<
		Partial<Record<SupportedCoinKey, CoinBalanceState>>
	>({});
	const activeCoin = selectedCoin ?? localSelectedCoin;
	const activeBalances = account ? (coinBalances ?? localBalances) : {};
	const activeBalanceOwner = coinBalances ? (balanceOwner ?? null) : (account?.address ?? null);

	React.useEffect(() => {
		if (coinBalances || !account) {
			return;
		}

		let cancelled = false;
		void Promise.all(
			coinEntries.map(async ([coinKey, { coinType, decimals }]) => {
				try {
					const response = await client.getBalance({
						owner: account.address,
						coinType,
					});
					return [
						coinKey,
						{
							balance: formatBalance(BigInt(response.balance.balance), decimals),
							isLoading: false,
							error: null,
						},
					] as const;
				} catch (error) {
					return [
						coinKey,
						{
							balance: null,
							isLoading: false,
							error: error instanceof Error ? error.message : String(error),
						},
					] as const;
				}
			}),
		).then((entries) => {
			if (!cancelled) setLocalBalances(Object.fromEntries(entries));
		});

		return () => {
			cancelled = true;
		};
	}, [account, client, coinBalances, coinEntries]);

	const handleCoinChange = (coin: SupportedCoinKey) => {
		if (onSelectedCoinChange) onSelectedCoinChange(coin);
		else setLocalSelectedCoin(coin);
	};

	const balanceNode = account ? (
		<div className="min-w-0 shrink">
			<Select value={activeCoin} onValueChange={handleCoinChange}>
				<SelectTrigger
					aria-label="Select active coin"
					className="h-10 w-full min-w-0 max-w-[10.5rem] rounded-full border-border/70 bg-background/55 px-3 sm:w-auto sm:min-w-[8.75rem] sm:max-w-none"
				>
					<CoinSelectLabel
						coinKey={activeCoin}
						amount={getCoinDisplayAmount({
							currentAccountAddress: account.address,
							balanceOwner: activeBalanceOwner,
							balanceState: activeBalances[activeCoin] ?? {
								balance: null,
								isLoading: true,
								error: null,
							},
						})}
						hideTickerOnMobile
					/>
				</SelectTrigger>
				<SelectContent>
					{coinEntries.map(([coinKey]) => (
						<SelectItem key={coinKey} value={coinKey}>
							<CoinSelectLabel
								coinKey={coinKey}
								amount={getCoinDisplayAmount({
									currentAccountAddress: account.address,
									balanceOwner: activeBalanceOwner,
									balanceState: activeBalances[coinKey] ?? {
										balance: null,
										isLoading: true,
										error: null,
									},
								})}
								hideTickerOnMobile={false}
							/>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	) : null;

	return (
		<nav className="flex flex-wrap items-center justify-between gap-3 rounded-[1.25rem] border border-border/65 bg-card/58 px-3 py-2 shadow-[0_18px_45px_-36px_rgba(8,47,91,0.5)] backdrop-blur-2xl supports-backdrop-filter:bg-card/45 sm:flex-nowrap sm:px-4 md:rounded-3xl md:py-2.5 dark:border-border/75 dark:bg-card/42 dark:shadow-[0_18px_45px_-36px_rgba(0,0,0,0.72)]">
			<Link
				href="/standard?game=coinflip"
				className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full p-1"
			>
				<Image
					src={withBasePath('/logo/icon.svg')}
					alt="Suigar"
					width={36}
					height={36}
					className="size-8 md:hidden"
					priority
				/>
				<Image
					src={withBasePath('/logo/suigar-logo-full.svg')}
					alt="Suigar"
					width={132}
					height={36}
					className="hidden w-auto md:block md:h-10"
					priority
				/>
			</Link>

			<div className="ml-auto flex min-w-0 w-full flex-1 items-center justify-end gap-2 sm:w-auto">
				<div className="hidden items-center gap-2 md:flex">
					{links.map((link) => (
						<Button
							key={link.href}
							asChild
							variant={link.isActive(activePathname) ? 'control-active' : 'control'}
							size="sm"
							className="rounded-full"
						>
							<Link href={link.href}>{link.label}</Link>
						</Button>
					))}
				</div>

				<div className="md:hidden">
					<Popover>
						<PopoverTrigger asChild>
							<Button
								variant="outline"
								size="icon"
								className="rounded-full"
								aria-label="Open navigation menu"
							>
								<Menu />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							align="end"
							collisionPadding={12}
							className="w-56 rounded-2xl border border-border/70 p-2"
						>
							<div className="flex flex-col gap-1">
								{links.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className={cn(
											'rounded-xl px-3 py-2 text-sm font-medium hover:bg-accent',
											link.isActive(activePathname) && 'bg-accent',
										)}
									>
										{link.label}
									</Link>
								))}
								<div className="flex items-center justify-between border-t border-border/70 px-2 pt-2">
									<span className="text-sm font-medium text-foreground">Theme</span>
									<ThemeToggle className="size-9" />
								</div>
							</div>
						</PopoverContent>
					</Popover>
				</div>

				<ThemeToggle className="hidden size-9 shrink-0 md:inline-flex md:size-10" />
				{balanceNode}
				<div className="min-w-0 shrink-0">
					<ConnectButton className="wallet-connect" />
				</div>
			</div>
		</nav>
	);
}
