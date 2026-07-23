// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { parseStructTag } from '@mysten/sui/utils';
import { amountText, asRecord, dynamicEntries, isRecord } from './format.js';
import type { AnyRecord, DefinitionEntry } from './types.js';

export type InspectorViewModel = {
	coinBadge: string | null;
	contextEntries: Array<DefinitionEntry>;
	transactionEntries: Array<DefinitionEntry>;
	gasEntries: Array<DefinitionEntry>;
	dryRunEntries: Array<DefinitionEntry>;
	targets: Array<string>;
	notes: Array<string>;
	errors: Array<string>;
};

const resultEventFields = (structuredContent: AnyRecord) => {
	const dryRunSummary = asRecord(structuredContent.dryRunSummary);
	const events = Array.isArray(dryRunSummary.events)
		? dryRunSummary.events
		: [];
	const eventRecords = events.map(asRecord);
	const event =
		eventRecords.find((item) => item.eventName === 'BetResultEvent') ??
		eventRecords.find((item) => {
			const fields = asRecord(item.fields);
			return (
				'player_bet' in fields ||
				'coin_outcome' in fields ||
				'outcome_amount' in fields ||
				'payout_amount' in fields
			);
		}) ??
		eventRecords.find((item) => isRecord(item.fields));
	return event ? asRecord(event.fields) : {};
};

const targetsFor = (structuredContent: AnyRecord) => {
	const summary = asRecord(structuredContent.summary);
	const plan = asRecord(structuredContent.plan);
	const commands = Array.isArray(summary.commands) ? summary.commands : [];
	const planTarget = typeof plan.target === 'string' ? [plan.target] : [];
	return commands
		.map((command) => asRecord(command).target)
		.filter((target): target is string => typeof target === 'string')
		.concat(planTarget);
};

const notesFor = (structuredContent: AnyRecord) => {
	const plan = asRecord(structuredContent.plan);
	const game = asRecord(structuredContent.game);
	return [
		...(Array.isArray(plan.notes) ? plan.notes : []),
		...(Array.isArray(game.notes) ? game.notes : []),
	].filter((note): note is string => typeof note === 'string');
};

const errorsFor = (structuredContent: AnyRecord) =>
	Array.isArray(structuredContent.errors)
		? structuredContent.errors.filter(
				(error): error is string => typeof error === 'string' && error !== '',
			)
		: [];

const fallbackStructName = (coinType: string) =>
	coinType.match(/::([^:<>,\s]+)(?:<.*>)?$/u)?.[1] ?? null;

const coinBadgeFor = (coinType: unknown) => {
	if (typeof coinType !== 'string' || coinType === '') {
		return null;
	}

	try {
		return parseStructTag(coinType).name;
	} catch {
		return fallbackStructName(coinType);
	}
};

const scalarText = (value: unknown) =>
	typeof value === 'string' ||
	typeof value === 'number' ||
	typeof value === 'bigint' ||
	typeof value === 'boolean'
		? String(value)
		: '';

export const createInspectorViewModel = (
	payload: unknown,
	explicitErrors: Array<string>,
): InspectorViewModel => {
	const record = asRecord(payload);
	const config = asRecord(record.config);
	const summary = asRecord(record.summary);
	const gameInputs = asRecord(summary.gameInputs);
	const dryRunSummary = asRecord(record.dryRunSummary);
	const gasUsed = asRecord(dryRunSummary.gasUsed);
	const eventFields = resultEventFields(record);
	const plan = asRecord(record.plan);
	const game = asRecord(record.game);
	const typeArguments = Array.isArray(plan.typeArguments)
		? plan.typeArguments
		: null;
	const requiredInputs = Array.isArray(plan.requiredInputs)
		? plan.requiredInputs
		: null;
	const coinType =
		summary.coinType ??
		game.coinType ??
		(typeArguments ? typeArguments[0] : null);

	return {
		coinBadge: coinBadgeFor(coinType),
		contextEntries: [
			['Network', record.network ?? config.network],
			['Game', game.id ?? summary.game],
			['Label', game.label],
			['Action', record.action ?? summary.action],
			['Coin type', coinType],
			['Package ID', game.packageId],
		],
		transactionEntries: [
			['Sender', summary.sender],
			[
				'Stake',
				summary.stakeDisplay
					? `${scalarText(summary.stakeDisplay)} (${scalarText(summary.stake)} base units)`
					: summary.stake,
			],
			...dynamicEntries(gameInputs),
			['Commands', summary.commandCount ?? (plan.target ? 'planned' : null)],
			['Inputs', summary.inputs ?? requiredInputs],
			['Type args', typeArguments],
			[
				'Serialized bytes',
				typeof record.transactionBytesBase64 === 'string'
					? `${record.transactionBytesBase64.length} chars`
					: null,
			],
		],
		gasEntries: [
			[
				'Gas budget',
				summary.gasBudgetDisplay
					? `${scalarText(summary.gasBudgetDisplay)} (${scalarText(summary.gasBudget)} base units)`
					: summary.gasBudget,
			],
			['Gas computation', amountText(gasUsed.computation)],
			['Gas storage', amountText(gasUsed.storage)],
			['Gas rebate', amountText(gasUsed.rebate)],
			['Net gas delta', amountText(gasUsed.net)],
		],
		dryRunEntries: [
			['Dry-run success', dryRunSummary.success],
			...dynamicEntries(eventFields),
			['Raw payload', record.dryRun ? 'included' : null],
		],
		targets: targetsFor(record),
		notes: notesFor(record),
		errors: explicitErrors.length > 0 ? explicitErrors : errorsFor(record),
	};
};
