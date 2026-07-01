// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	App,
	applyDocumentTheme,
	applyHostFonts,
	applyHostStyleVariables,
} from '@modelcontextprotocol/ext-apps';
import './styles.css';

type AnyRecord = Record<string, unknown>;

const statusElement = document.querySelector<HTMLDivElement>('#status')!;
const contextElement = document.querySelector<HTMLDListElement>('#context')!;
const transactionPanelElement =
	document.querySelector<HTMLElement>('#transaction-panel')!;
const summaryElement = document.querySelector<HTMLDListElement>('#summary')!;
const gasPanelElement = document.querySelector<HTMLElement>('#gas-panel')!;
const gasElement = document.querySelector<HTMLDListElement>('#gas')!;
const dryRunPanelElement =
	document.querySelector<HTMLElement>('#dry-run-panel')!;
const dryRunElement = document.querySelector<HTMLDListElement>('#dry-run')!;
const targetPanelElement =
	document.querySelector<HTMLElement>('#target-panel')!;
const targetsElement = document.querySelector<HTMLUListElement>('#targets')!;
const notesPanelElement = document.querySelector<HTMLElement>('#notes-panel')!;
const notesElement = document.querySelector<HTMLUListElement>('#notes')!;
const errorsPanelElement =
	document.querySelector<HTMLElement>('#errors-panel')!;
const errorsElement = document.querySelector<HTMLUListElement>('#errors')!;
const resultElement = document.querySelector<HTMLPreElement>('#result')!;

const asRecord = (value: unknown): AnyRecord =>
	value && typeof value === 'object' ? (value as AnyRecord) : {};

const isRecord = (value: unknown): value is AnyRecord =>
	value !== null && typeof value === 'object';

const stringify = (value: unknown) =>
	JSON.stringify(
		value,
		(_key, item) => (typeof item === 'bigint' ? item.toString() : item),
		2,
	);

const formatValue = (value: unknown) => {
	if (Array.isArray(value)) {
		return value.length > 0 ? value.join(', ') : null;
	}
	if (value && typeof value === 'object') {
		const record = asRecord(value);
		if (typeof record.label === 'string' && typeof record.id === 'string') {
			return `${record.label} (${record.id})`;
		}
		if (typeof record.id === 'string') {
			return record.id;
		}
		return stringify(value);
	}
	return value;
};

const setDefinitionList = (
	element: HTMLDListElement,
	entries: Array<[string, unknown]>,
) => {
	const visibleEntries = entries.filter(([, value]) => {
		const formattedValue = formatValue(value);
		return formattedValue != null && formattedValue !== '';
	});
	element.replaceChildren(
		...visibleEntries.flatMap(([label, value]) => {
			const term = document.createElement('dt');
			term.textContent = label;
			const detail = document.createElement('dd');
			const formattedValue = formatValue(value);
			const text = String(formattedValue);
			detail.textContent = text;
			detail.title = text;
			detail.className = 'value';
			return [term, detail];
		}),
	);
	return visibleEntries.length > 0;
};

const renderTargets = (structuredContent: AnyRecord) => {
	const summary = asRecord(structuredContent.summary);
	const plan = asRecord(structuredContent.plan);
	const commands = Array.isArray(summary.commands) ? summary.commands : [];
	const planTarget = typeof plan.target === 'string' ? [plan.target] : [];
	const targets = commands
		.map((command) => asRecord(command).target)
		.filter((target): target is string => typeof target === 'string')
		.concat(planTarget);

	targetPanelElement.hidden = targets.length === 0;
	targetsElement.replaceChildren(
		...targets.map((target) => {
			const item = document.createElement('li');
			item.textContent = target;
			return item;
		}),
	);
};

const renderNotes = (structuredContent: AnyRecord) => {
	const plan = asRecord(structuredContent.plan);
	const game = asRecord(structuredContent.game);
	const notes = [
		...(Array.isArray(plan.notes) ? plan.notes : []),
		...(Array.isArray(game.notes) ? game.notes : []),
	].filter((note): note is string => typeof note === 'string');

	notesPanelElement.hidden = notes.length === 0;
	notesElement.replaceChildren(
		...notes.map((note) => {
			const item = document.createElement('li');
			item.textContent = note;
			return item;
		}),
	);
};

const renderErrors = (structuredContent: AnyRecord) => {
	const errors = Array.isArray(structuredContent.errors)
		? structuredContent.errors.filter(
				(error): error is string => typeof error === 'string' && error !== '',
			)
		: [];

	errorsPanelElement.hidden = errors.length === 0;
	errorsElement.replaceChildren(
		...errors.map((error) => {
			const item = document.createElement('li');
			item.textContent = error;
			return item;
		}),
	);
};

const amountText = (value: unknown) => {
	const amount = asRecord(value);
	if (typeof amount.display === 'string' && typeof amount.raw === 'string') {
		return `${amount.display} (${amount.raw} base units)`;
	}
	return value;
};

const labelFor = (key: string) =>
	key
		.replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
		.replace(/_/gu, ' ')
		.replace(/\b\w/gu, (character) => character.toUpperCase());

const dynamicEntries = (record: AnyRecord) =>
	Object.entries(record)
		.filter(([key]) => {
			if (key.endsWith('_display')) {
				return false;
			}
			return ![
				'game_details',
				'metadata',
				'player',
				'coin_type',
				'unsafe_oracle_usd_coin_price',
				'adjusted_oracle_usd_coin_price',
			].includes(key);
		})
		.map(
			([key, value]) =>
				[labelFor(key), record[`${key}_display`] ?? value] as [string, unknown],
		);

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

const renderResult = (structuredContent: unknown) => {
	const record = asRecord(structuredContent);
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

	statusElement.textContent = record.mode ? String(record.mode) : 'read';
	setDefinitionList(contextElement, [
		['Network', record.network ?? config.network],
		['Game', game.id ?? summary.game],
		['Label', game.label],
		['Action', record.action ?? summary.action],
		[
			'Coin type',
			summary.coinType ??
				game.coinType ??
				(typeArguments ? typeArguments[0] : null),
		],
		['Package ID', game.packageId],
	]);
	transactionPanelElement.hidden = !setDefinitionList(summaryElement, [
		['Sender', summary.sender],
		[
			'Stake',
			summary.stakeDisplay
				? `${summary.stakeDisplay} (${summary.stake} base units)`
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
	]);
	gasPanelElement.hidden = !setDefinitionList(gasElement, [
		[
			'Gas budget',
			summary.gasBudgetDisplay
				? `${summary.gasBudgetDisplay} (${summary.gasBudget} base units)`
				: summary.gasBudget,
		],
		['Gas computation', amountText(gasUsed.computation)],
		['Gas storage', amountText(gasUsed.storage)],
		['Gas rebate', amountText(gasUsed.rebate)],
		['Net gas delta', amountText(gasUsed.net)],
	]);
	dryRunPanelElement.hidden = !setDefinitionList(dryRunElement, [
		['Dry-run success', dryRunSummary.success],
		...dynamicEntries(eventFields),
		['Raw payload', record.dryRun ? 'included' : null],
	]);
	renderTargets(record);
	renderNotes(record);
	renderErrors(record);
	resultElement.textContent = stringify(structuredContent);
};

const app = new App({ name: 'suigar-transaction-inspector', version: '0.1.0' });

app.ontoolinput = ({ arguments: args }) => {
	statusElement.textContent = 'Running tool';
	renderErrors({});
	resultElement.textContent = stringify(args ?? {});
};

app.ontoolresult = (result) => {
	if (result.isError) {
		statusElement.textContent = 'Error';
		const content = result.content as
			Array<{ type?: string; text?: string }> | undefined;
		const text = content
			?.map((item) => (item.type === 'text' ? (item.text ?? '') : ''))
			.filter(Boolean)
			.join('\n');
		renderErrors({ errors: text ? [text] : ['Tool call failed.'] });
		resultElement.textContent = stringify(result);
		return;
	}
	renderResult(result.structuredContent ?? result);
};

app.onhostcontextchanged = ({ context }) => {
	applyDocumentTheme(context);
	applyHostStyleVariables(context);
	applyHostFonts(context);
};

await app.connect();
