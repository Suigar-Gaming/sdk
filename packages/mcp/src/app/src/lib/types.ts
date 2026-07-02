// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

export type AnyRecord = Record<string, unknown>;

export type InspectorState = {
	status: string;
	payload: unknown;
	errors: string[];
};

export type DefinitionEntry = [label: string, value: unknown];
