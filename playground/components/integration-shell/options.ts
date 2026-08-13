'use client';

import { CirclePlus, ShieldX, Swords } from 'lucide-react';

import type { PvPAction, PvPGameId, StandardGameId } from '@/lib/suigar-types';

export const STANDARD_GAME_OPTIONS = [
	{ value: 'coinflip', label: 'Coinflip' },
	{ value: 'limbo', label: 'Limbo' },
	{ value: 'plinko', label: 'Plinko' },
	{ value: 'range', label: 'Range' },
	{ value: 'soccer', label: 'Soccer' },
	{ value: 'wheel', label: 'Wheel' },
] as const satisfies ReadonlyArray<{ value: StandardGameId; label: string }>;

export const PVP_ACTION_OPTIONS = [
	{ value: 'create', label: 'Create', icon: CirclePlus },
	{ value: 'join', label: 'Join', icon: Swords },
	{ value: 'cancel', label: 'Cancel', icon: ShieldX },
] as const satisfies ReadonlyArray<{
	value: PvPAction;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}>;

export const PVP_GAME_OPTIONS = [
	{ value: 'pvp-coinflip', label: 'PvP Coinflip' },
] as const satisfies ReadonlyArray<{ value: PvPGameId; label: string }>;
