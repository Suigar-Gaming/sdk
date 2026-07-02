// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { readFileSync } from 'node:fs';

export const packageJson = JSON.parse(
	readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
) as { version: string };
