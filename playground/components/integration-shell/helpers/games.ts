import {
	PVP_ACTION_OPTIONS,
	PVP_GAME_OPTIONS,
	STANDARD_GAME_OPTIONS,
} from '@/components/integration-shell/options';
import type { PvPAction, PvPGameId, StandardGameId } from '@/lib/suigar-types';

export function isStandardGame(value: string | null): value is StandardGameId {
	return STANDARD_GAME_OPTIONS.some((option) => option.value === value);
}

export function isPvPAction(value: string | null): value is PvPAction {
	return PVP_ACTION_OPTIONS.some((option) => option.value === value);
}

export function isPvPGame(value: string | null): value is PvPGameId {
	return PVP_GAME_OPTIONS.some((option) => option.value === value);
}

export function getStandardGameLabel(game: StandardGameId) {
	return STANDARD_GAME_OPTIONS.find((option) => option.value === game)?.label ?? game;
}

export function getPvPGameLabel(game: PvPGameId) {
	return PVP_GAME_OPTIONS.find((option) => option.value === game)?.label ?? game;
}
