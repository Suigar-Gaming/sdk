// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import {
	normalizeSuiAddress,
	SUI_FRAMEWORK_ADDRESS,
	SUI_RANDOM_OBJECT_ID,
} from '@mysten/sui/utils';

/**
 * Temporary compatibility workaround for MystenLabs/ts-sdks#1170.
 *
 * Remove this file and its callers when CoinWithBalance no longer appends
 * cleanup commands after a Random-consuming MoveCall.
 */
export function moveCoinWithBalanceCleanupBeforeRandom(tx: Transaction): void {
	tx.addBuildPlugin(async (transactionData, _options, next) => {
		await next();

		let randomMoveCallIndex = transactionData.commands.findIndex((command) => {
			if (command.$kind !== 'MoveCall') return false;

			return command.MoveCall.arguments.some((argument) => {
				if (argument.$kind !== 'Input') return false;

				const input = transactionData.inputs[argument.Input];
				const objectId =
					input?.UnresolvedObject?.objectId ??
					input?.Object?.SharedObject?.objectId;
				return objectId === SUI_RANDOM_OBJECT_ID;
			});
		});

		if (randomMoveCallIndex === -1) return;

		const cleanupCount = transactionData.commands
			.slice(randomMoveCallIndex + 1)
			.filter(isCoinWithBalanceCleanup).length;

		for (
			let movedCleanupCount = 0;
			movedCleanupCount < cleanupCount;
			movedCleanupCount += 1
		) {
			const cleanupIndex = transactionData.commands.findLastIndex(
				(command, index) =>
					index > randomMoveCallIndex && isCoinWithBalanceCleanup(command),
			);
			if (cleanupIndex === -1) {
				throw new Error(
					'Expected CoinWithBalance cleanup command was not found',
				);
			}

			const cleanup = transactionData.commands[cleanupIndex]!;
			transactionData.commands.splice(cleanupIndex, 1);
			transactionData.commands.splice(randomMoveCallIndex, 0, cleanup);
			transactionData.mapArguments((argument) => {
				if (argument.$kind === 'Result') {
					return {
						...argument,
						Result: reorderCommandIndex(
							argument.Result,
							randomMoveCallIndex,
							cleanupIndex,
						),
					};
				}

				if (argument.$kind === 'NestedResult') {
					return {
						...argument,
						NestedResult: [
							reorderCommandIndex(
								argument.NestedResult[0],
								randomMoveCallIndex,
								cleanupIndex,
							),
							argument.NestedResult[1],
						],
					};
				}

				return argument;
			});
			randomMoveCallIndex += 1;
		}
	});
}

function isCoinWithBalanceCleanup(command: {
	$kind: string;
	MoveCall?: { package: string; module: string; function: string };
}): boolean {
	return (
		command.$kind === 'MoveCall' &&
		command.MoveCall != null &&
		normalizeSuiAddress(command.MoveCall.package) === SUI_FRAMEWORK_ADDRESS &&
		command.MoveCall.module === 'coin' &&
		(command.MoveCall.function === 'destroy_zero' ||
			command.MoveCall.function === 'send_funds')
	);
}

function reorderCommandIndex(
	index: number,
	insertAt: number,
	movedFrom: number,
) {
	if (index === movedFrom) return insertAt;
	return index >= insertAt && index < movedFrom ? index + 1 : index;
}
