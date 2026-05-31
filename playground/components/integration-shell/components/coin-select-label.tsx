'use client';

import { CoinIcon } from '@/components/coins';
import type { SupportedCoinKey } from '@/lib/suigar-types';
import { cn } from '@/lib/utils';

export function CoinSelectLabel({
	coinKey,
	amount,
	hideTickerOnMobile = false,
}: {
	coinKey: SupportedCoinKey;
	amount: string;
	hideTickerOnMobile?: boolean;
}) {
	return (
		<div className="flex min-w-0 items-center gap-2 whitespace-nowrap">
			<CoinIcon coinKey={coinKey} className="size-5 shrink-0" />
			<div className="flex min-w-0 items-center gap-1.5 leading-none">
				<span className="min-w-0 truncate font-medium tabular-nums leading-none text-foreground">
					{amount}
				</span>
				<span
					className={cn(
						'shrink-0 text-[0.68rem] leading-none font-semibold tracking-[0.08em] text-muted-foreground',
						hideTickerOnMobile && 'hidden sm:inline',
					)}
				>
					{coinKey.toUpperCase()}
				</span>
			</div>
		</div>
	);
}
