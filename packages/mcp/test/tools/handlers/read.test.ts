// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import { readGameMetadataTool } from '../../../src/tools/handlers/index.js';

describe('read_game_metadata', () => {
	it('requires one supported game when reading live game metadata', async () => {
		await expect(readGameMetadataTool({})).rejects.toThrow('Missing required field: game.');
		await expect(readGameMetadataTool({ game: 'slots' as never })).rejects.toThrow(
			/Unsupported game/u,
		);
	});
});
