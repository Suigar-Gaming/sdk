// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { stringify, valueTone, visibleDefinitionEntries } from './format.js';
import type { DefinitionEntry } from './types.js';
import { cn } from './utils.js';

const panelClassName =
	'grid min-w-0 content-start gap-3 rounded-lg border border-cyan-200/80 bg-cyan-50/80 p-3.5 text-slate-950 shadow-sm shadow-cyan-950/5 dark:border-slate-700 dark:bg-slate-900/85 dark:text-slate-100';

const valueClassName =
	'flex min-h-8 min-w-0 items-center overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-md border border-cyan-200/80 bg-white/75 px-2.5 py-1 font-mono text-[13px] leading-5 text-slate-950 dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-100';

const listItemClassNames = {
	errors:
		'rounded-lg border border-l-4 border-rose-400/70 bg-rose-50/90 px-3 py-2 text-[13px] font-semibold leading-5 text-rose-800 dark:border-rose-400/70 dark:bg-rose-950/35 dark:text-rose-200',
	notes:
		'rounded-lg border border-l-4 border-sky-300 bg-sky-50/90 px-3 py-2 text-[13px] font-semibold leading-5 text-sky-800 dark:border-sky-500/70 dark:bg-sky-950/35 dark:text-sky-200',
	targets:
		'min-w-0 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg border border-cyan-200/80 bg-white/75 px-3 py-2 font-mono text-xs leading-5 text-slate-900 dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-100',
} as const;

export function Header({ status }: { status: string }) {
	return (
		<header className="flex min-w-0 flex-col gap-4 rounded-lg border border-cyan-200/80 bg-cyan-50/80 p-4 shadow-sm shadow-cyan-950/5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-700 dark:bg-slate-900/85">
			<div>
				<p className="mb-1 text-xs font-extrabold uppercase tracking-[0.18em] text-slate-600 dark:text-slate-400">
					Suigar MCP
				</p>
				<h1 className="text-2xl font-extrabold leading-tight text-slate-950 dark:text-slate-100">
					Transaction Inspector
				</h1>
			</div>
			<div className="w-max max-w-full rounded-full border border-amber-400 bg-amber-300 px-3 py-1.5 text-[13px] font-extrabold leading-tight text-amber-950 sm:shrink-0">
				{status}
			</div>
		</header>
	);
}

export function Panel({
	children,
	className,
	hidden,
	title,
}: {
	children: ReactNode;
	className?: string;
	hidden?: boolean;
	title: string;
}) {
	if (hidden) {
		return null;
	}

	return (
		<section className={cn(panelClassName, className)}>
			<div className="flex min-w-0 items-center justify-between gap-3">
				<h2 className="text-[15px] font-extrabold leading-tight text-slate-950 dark:text-slate-100">
					{title}
				</h2>
			</div>
			{children}
		</section>
	);
}

export function DefinitionList({ entries }: { entries: DefinitionEntry[] }) {
	const visibleEntries = visibleDefinitionEntries(entries);
	if (visibleEntries.length === 0) {
		return null;
	}

	return (
		<dl className="grid grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[minmax(92px,0.42fr)_minmax(0,1fr)]">
			{visibleEntries.map(([label, value]) => {
				const text = String(value);
				const tone = valueTone(label, value);
				return (
					<div className="contents" key={label}>
						<dt className="flex min-h-8 items-center text-[13px] font-bold leading-5 text-slate-600 dark:text-slate-400">
							{label}
						</dt>
						<dd
							className={cn(
								valueClassName,
								tone === 'success' &&
									'border-emerald-400/70 bg-emerald-50/90 text-emerald-800 dark:border-emerald-400/70 dark:bg-emerald-950/35 dark:text-emerald-200',
								tone === 'error' &&
									'border-rose-400/70 bg-rose-50/90 text-rose-800 dark:border-rose-400/70 dark:bg-rose-950/35 dark:text-rose-200',
							)}
							title={text}
						>
							{text}
						</dd>
					</div>
				);
			})}
		</dl>
	);
}

export function ListPanel({
	className,
	items,
	title,
}: {
	className: keyof typeof listItemClassNames;
	items: string[];
	title: string;
}) {
	return (
		<Panel hidden={items.length === 0} title={title}>
			<ul className="grid gap-2">
				{items.map((item) => (
					<li className={listItemClassNames[className]} key={item}>
						{item}
					</li>
				))}
			</ul>
		</Panel>
	);
}

export function RawPayload({ payload }: { payload: unknown }) {
	return (
		<details className={cn(panelClassName, 'block')}>
			<summary className="cursor-pointer list-inside text-[13px] font-extrabold text-slate-600 outline-amber-400 focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 dark:text-slate-400">
				Raw payload
			</summary>
			<pre className="mt-3 max-h-105 overflow-auto rounded-lg border border-cyan-200/80 bg-white/75 p-3 font-mono text-xs leading-5 text-slate-900 dark:border-slate-700 dark:bg-slate-950/75 dark:text-slate-100">
				{stringify(payload)}
			</pre>
		</details>
	);
}
