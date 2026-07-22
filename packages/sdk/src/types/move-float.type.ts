// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { InferBcsType } from '@mysten/bcs';
import type { Float } from '../contracts/core/float.js';

export type MoveFloat = InferBcsType<typeof Float>;
