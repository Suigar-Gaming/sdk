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
const summaryElement = document.querySelector<HTMLDListElement>('#summary')!;
const targetsElement = document.querySelector<HTMLUListElement>('#targets')!;
const resultElement = document.querySelector<HTMLPreElement>('#result')!;

const asRecord = (value: unknown): AnyRecord =>
	value && typeof value === 'object' ? (value as AnyRecord) : {};

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
	return value;
};

const setDefinitionList = (
	element: HTMLDListElement,
	entries: Array<[string, unknown]>,
) => {
	element.replaceChildren(
		...entries.flatMap(([label, value]) => {
			const term = document.createElement('dt');
			term.textContent = label;
			const detail = document.createElement('dd');
			const formattedValue = formatValue(value);
			const text =
				formattedValue == null || formattedValue === ''
					? 'n/a'
					: String(formattedValue);
			detail.textContent = text;
			detail.title = text === 'n/a' ? '' : text;
			detail.className = text === 'n/a' ? 'is-empty' : 'value';
			return [term, detail];
		}),
	);
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

	targetsElement.replaceChildren(
		...(targets.length > 0 ? targets : ['No Move target available yet']).map(
			(target) => {
				const item = document.createElement('li');
				item.textContent = target;
				return item;
			},
		),
	);
};

const renderResult = (structuredContent: unknown) => {
	const record = asRecord(structuredContent);
	const config = asRecord(record.config);
	const sdkConfig = asRecord(config.sdk);
	const summary = asRecord(record.summary);
	const plan = asRecord(record.plan);
	const typeArguments = Array.isArray(plan.typeArguments)
		? plan.typeArguments
		: null;
	const requiredInputs = Array.isArray(plan.requiredInputs)
		? plan.requiredInputs
		: null;

	statusElement.textContent = record.mode ? String(record.mode) : 'read';
	setDefinitionList(contextElement, [
		['Network', record.network ?? config.network],
		['Game', record.game ?? summary.game],
		['Action', record.action ?? summary.action],
		[
			'Coin type',
			summary.coinType ??
				asRecord(record.game).coinType ??
				(typeArguments ? typeArguments[0] : null),
		],
		['SweetHouse', asRecord(sdkConfig.packageIds).sweetHouse],
	]);
	setDefinitionList(summaryElement, [
		['Sender', summary.sender],
		['Gas budget', summary.gasBudget],
		['Commands', summary.commandCount ?? (plan.target ? 'planned' : null)],
		['Inputs', summary.inputs ?? requiredInputs],
		['Type args', typeArguments],
		[
			'Serialized bytes',
			typeof record.transactionBytesBase64 === 'string'
				? `${record.transactionBytesBase64.length} chars`
				: null,
		],
		['Dry-run', record.dryRun ? 'included' : null],
	]);
	renderTargets(record);
	resultElement.textContent = stringify(structuredContent);
};

const app = new App({ name: 'suigar-transaction-inspector', version: '0.1.0' });

app.ontoolinput = ({ arguments: args }) => {
	statusElement.textContent = 'Running tool';
	resultElement.textContent = stringify(args ?? {});
};

app.ontoolresult = (result) => {
	if (result.isError) {
		statusElement.textContent = 'Error';
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
