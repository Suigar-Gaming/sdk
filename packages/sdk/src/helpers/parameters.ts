// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { GameParameterValue } from '../types/game-settings.type.js';
import { fromMoveFloat, isMoveFloat } from '../utils/numeric.js';

/**
 * Recursively converts generated Move float structs within game parameters to
 * JavaScript numbers while preserving on-chain integer strings.
 */
export function normalizeGameParameterValues<TGameParameters>(
	value: TGameParameters,
): GameParameterValue<TGameParameters> {
	if (isMoveFloat(value)) {
		return fromMoveFloat(value) as GameParameterValue<TGameParameters>;
	}

	if (Array.isArray(value)) {
		return value.map((item) =>
			normalizeGameParameterValues(item),
		) as GameParameterValue<TGameParameters>;
	}

	if (typeof value === 'object' && value !== null) {
		const normalized: Record<
			string,
			GameParameterValue<TGameParameters[keyof TGameParameters]>
		> = {};
		for (const key of Object.keys(value)) {
			normalized[key] = normalizeGameParameterValues(
				value[key as keyof TGameParameters],
			);
		}
		return normalized as GameParameterValue<TGameParameters>;
	}

	return value as GameParameterValue<TGameParameters>;
}
