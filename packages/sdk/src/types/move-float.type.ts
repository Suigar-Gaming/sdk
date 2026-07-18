// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { InferBcsType } from '@mysten/bcs';
import { Float } from '../contracts/core/float.js';

export type MoveFloat = InferBcsType<typeof Float>;
