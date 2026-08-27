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
				<span className="text-foreground min-w-0 truncate leading-none font-medium tabular-nums">
					{amount}
				</span>
				<span
					className={cn(
						'shrink-0 text-xs leading-none font-semibold tracking-widest text-muted-foreground uppercase',
						hideTickerOnMobile && 'hidden sm:inline',
					)}
				>
					{coinKey}
				</span>
			</div>
		</div>
	);
}
