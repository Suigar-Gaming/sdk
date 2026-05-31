import {
	isPvPAction,
	isPvPGame,
	isStandardGame,
} from '@/components/integration-shell/helpers/games';

export function getStandardGameFromParams(params: URLSearchParams) {
	const queryGame = params.get('game');
	return isStandardGame(queryGame) ? queryGame : 'coinflip';
}

export function getPvPActionFromParams(params: URLSearchParams) {
	const queryAction = params.get('action');
	return isPvPAction(queryAction) ? queryAction : 'create';
}

export function getPvPGameFromParams(params: URLSearchParams) {
	const queryGame = params.get('game');
	return isPvPGame(queryGame) ? queryGame : 'pvp-coinflip';
}
