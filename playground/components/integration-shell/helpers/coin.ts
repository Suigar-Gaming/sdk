import { normalizeStructTag, parseStructTag } from '@mysten/sui/utils';
import type { SupportedCoinKey } from '@/lib/suigar-types';

export type CoinBalanceState = {
	balance: string | null;
	isLoading: boolean;
	error: string | null;
};

export function formatBalance(balance: bigint, decimals: number) {
	const divisor = BigInt(10) ** BigInt(decimals);
	const whole = balance / divisor;
	const fraction = balance % divisor;
	const paddedFraction = fraction.toString().padStart(decimals, '0');
	const formattedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	const fractionDigits = paddedFraction.slice(0, 2).padEnd(2, '0');

	return `${formattedWhole},${fractionDigits}`;
}

export function resolveCoinKeyForType(
	coinType: string,
	coinTypes: Record<SupportedCoinKey, string>,
) {
	const normalizedCoinType = normalizeStructTag(coinType);

	return (
		(Object.entries(coinTypes) as Array<[SupportedCoinKey, string]>).find(
			([, configuredCoinType]) => normalizeStructTag(configuredCoinType) === normalizedCoinType,
		)?.[0] ?? null
	);
}

export function parseCoinKey(coinType: string, coinTypes: Record<SupportedCoinKey, string>) {
	return resolveCoinKeyForType(coinType, coinTypes);
}

export function parseCoinTypeLabel(coinType: string, coinTypes: Record<SupportedCoinKey, string>) {
	const matchingCoinKey = resolveCoinKeyForType(coinType, coinTypes);
	if (matchingCoinKey) {
		return matchingCoinKey.toUpperCase();
	}

	const normalizedCoinType = normalizeStructTag(coinType);
	return parseStructTag(normalizedCoinType).name;
}

export function getCoinDisplayAmount({
	currentAccountAddress,
	balanceOwner,
	balanceState,
}: {
	currentAccountAddress: string | null | undefined;
	balanceOwner: string | null;
	balanceState: CoinBalanceState;
}) {
	if (!currentAccountAddress) {
		return '--,--';
	}

	if (
		(balanceOwner !== currentAccountAddress && !balanceState.error) ||
		balanceState.isLoading ||
		balanceState.error
	) {
		return '--,--';
	}

	return balanceState.balance ?? '0,00';
}
