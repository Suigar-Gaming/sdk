// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export class MismatchCoinType extends Error {
	readonly expectedCoinType: string;
	readonly actualCoinType: string;
	readonly gameId?: string;

	constructor({
		expectedCoinType,
		actualCoinType,
		gameId,
	}: {
		expectedCoinType: string;
		actualCoinType: string;
		gameId?: string;
	}) {
		super(
			`Mismatched coin type${gameId ? ` for game ${gameId}` : ''}: expected ${expectedCoinType}, received ${actualCoinType}`,
		);
		this.name = 'MismatchCoinType';
		this.expectedCoinType = expectedCoinType;
		this.actualCoinType = actualCoinType;
		this.gameId = gameId;
	}
}
