// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { Float } from '../contracts/core/float';

export type MoveFloat = ReturnType<(typeof Float)['parse']>;
