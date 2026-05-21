'use client';

import { CoinIcon } from '@/components/coins';
import { FieldCode, FieldDescription } from '@/components/ui/field';
import { Spinner } from '@/components/ui/spinner';
import type { PvPAction, SupportedCoinKey } from '@/lib/suigar-types';

export function StakeDescription({
	stakeRange,
	isLoading,
	error,
	effectiveSelectedCoin,
	activeConfigDisabled = false,
}: {
	stakeRange: { min: string; max: string } | null | undefined;
	isLoading: boolean;
	error: string | null;
	effectiveSelectedCoin: SupportedCoinKey;
	activeConfigDisabled?: boolean;
}) {
	if (isLoading) {
		return (
			<FieldDescription size="sm" className="inline-flex items-center gap-1.5">
				<Spinner className="size-3.5" />
				Loading on-chain stake limits for this coin.
			</FieldDescription>
		);
	}

	if (error) {
		return (
			<FieldDescription size="sm">
				Unable to load on-chain stake limits: {error}
			</FieldDescription>
		);
	}

	if (!stakeRange) {
		return null;
	}

	return (
		<FieldDescription size="sm">
			<span className="inline-flex flex-nowrap items-center gap-2 overflow-x-auto align-middle">
				<span className="shrink-0">On-chain stake range:</span>
				<FieldCode className="shrink-0">{stakeRange.min}</FieldCode>
				<span className="shrink-0">to</span>
				<FieldCode className="shrink-0">{stakeRange.max}</FieldCode>
				<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap uppercase tracking-[0.12em]">
					<CoinIcon coinKey={effectiveSelectedCoin} className="size-4" />
					{effectiveSelectedCoin.toUpperCase()}
				</span>
			</span>
			{activeConfigDisabled
				? '. The selected config is disabled on-chain.'
				: '.'}
		</FieldDescription>
	);
}

export function PvPStakeDescription({
	mode,
	pvpAction,
	stakeRange,
	isLoading,
	error,
	effectiveSelectedCoin,
}: {
	mode: 'standard' | 'pvp';
	pvpAction: PvPAction;
	stakeRange: { min: string; max: string } | null | undefined;
	isLoading: boolean;
	error: string | null;
	effectiveSelectedCoin: SupportedCoinKey;
}) {
	if (mode !== 'pvp' || pvpAction !== 'create') {
		return null;
	}

	if (isLoading) {
		return (
			<FieldDescription size="sm" className="inline-flex items-center gap-1.5">
				<Spinner className="size-3.5" />
				Loading on-chain stake minimum for this coin.
			</FieldDescription>
		);
	}

	if (error) {
		return (
			<FieldDescription size="sm">
				Unable to load on-chain stake minimum: {error}
			</FieldDescription>
		);
	}

	if (!stakeRange) {
		return null;
	}

	return (
		<FieldDescription size="sm">
			<span className="inline-flex flex-nowrap items-center gap-2 overflow-x-auto align-middle">
				<span className="shrink-0">On-chain stake minimum:</span>
				<FieldCode className="shrink-0">{stakeRange.min}</FieldCode>
				<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap uppercase tracking-[0.12em]">
					<CoinIcon coinKey={effectiveSelectedCoin} className="size-4" />
					{effectiveSelectedCoin.toUpperCase()}
				</span>
			</span>
			.
		</FieldDescription>
	);
}
