import { SuiCoinIcon } from '@/components/coins/sui';
import { UsdcCoinIcon } from '@/components/coins/usdc';
import type { SupportedCoinKey } from '@/lib/suigar-types';

export function CoinIcon({
	coinKey,
	className,
}: {
	coinKey: SupportedCoinKey;
	className?: string;
}) {
	if (coinKey === 'sui') {
		return <SuiCoinIcon className={className} />;
	}

	return <UsdcCoinIcon className={className} />;
}
