// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { stringify, valueTone, visibleDefinitionEntries } from '../lib/format.js';
import type { DefinitionEntry } from '../lib/types.js';
import { cn } from '../lib/utils.js';

const panelClassName =
	'grid min-w-0 content-start gap-3 rounded-lg border border-border/70 bg-card/88 p-3.5 text-card-foreground';

const valueClassName =
	'flex min-h-8 min-w-0 items-center overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-md border border-border/70 bg-background/75 px-2.5 py-1 font-mono text-xs leading-5 text-foreground';

const actionLinkClassName =
	'border-primary/75 bg-primary text-primary-foreground focus-visible:outline-ring inline-flex min-h-10 items-center justify-center rounded-md border px-5 py-2 text-sm font-extrabold transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2';

const LIST_ITEM_CLASS_NAMES: Record<'errors' | 'notes' | 'targets', string> = {
	errors:
		'rounded-lg border border-l-4 border-destructive/70 bg-destructive/10 px-3 py-2 text-xs font-semibold leading-5 text-foreground',
	notes:
		'rounded-lg border border-l-4 border-secondary/65 bg-secondary/12 px-3 py-2 text-xs font-semibold leading-5 text-foreground',
	targets:
		'min-w-0 overflow-x-auto overflow-y-hidden whitespace-nowrap rounded-lg border border-border/70 bg-background/75 px-3 py-2 font-mono text-xs leading-5 text-foreground',
};

export function Header({
	coinBadge,
	status,
	title = 'Transaction Inspector',
}: {
	coinBadge?: string | null;
	status: string;
	title?: string;
}) {
	return (
		<header className="border-border/70 bg-card/88 flex min-w-0 flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<p className="text-muted-foreground mb-1 text-xs font-extrabold tracking-widest uppercase">
					Suigar MCP
				</p>
				<h1 className="text-foreground text-2xl leading-tight font-extrabold">{title}</h1>
			</div>
			<div className="flex max-w-full flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
				{coinBadge ? (
					<div
						className="border-secondary/75 bg-secondary text-secondary-foreground w-max max-w-full rounded-full border px-3 py-1.5 font-mono text-xs leading-tight font-extrabold"
						title={`Coin ${coinBadge}`}
					>
						{coinBadge}
					</div>
				) : null}
				<div className="border-primary/75 bg-primary text-primary-foreground w-max max-w-full rounded-full border px-3 py-1.5 text-xs leading-tight font-extrabold">
					{status.toLowerCase()}
				</div>
			</div>
		</header>
	);
}

export function ExecutionApproval({ url }: { url: string | null }) {
	if (!url) {
		return null;
	}

	return (
		<section className={cn(panelClassName, 'justify-items-center px-4 py-5 text-center')}>
			<div>
				<h2 className="text-card-foreground text-sm leading-tight font-extrabold">
					Transaction approval
				</h2>
				<p className="text-muted-foreground mt-1 text-xs leading-5 font-semibold">
					Review the transaction in your wallet before submitting it.
				</p>
			</div>
			<ActionLink href={url}>Sign and Execute</ActionLink>
		</section>
	);
}

export function ActionLink({ children, href }: { children: ReactNode; href: string }) {
	return (
		<a className={actionLinkClassName} href={href} rel="noreferrer" target="_blank">
			{children}
		</a>
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
				<h2 className="text-card-foreground text-sm leading-tight font-extrabold">{title}</h2>
			</div>
			{children}
		</section>
	);
}

export function DefinitionList({ entries }: { entries: Array<DefinitionEntry> }) {
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
						<dt className="text-muted-foreground flex min-h-8 items-center text-xs leading-5 font-bold">
							{label}
						</dt>
						<dd
							className={cn(
								valueClassName,
								tone === 'success' && 'border-success/70 bg-success/12 text-foreground',
								tone === 'error' && 'border-destructive/70 bg-destructive/10 text-foreground',
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
	className: keyof typeof LIST_ITEM_CLASS_NAMES;
	items: Array<string>;
	title: string;
}) {
	return (
		<Panel hidden={items.length === 0} title={title}>
			<ul className="grid gap-2">
				{items.map((item) => (
					<li className={LIST_ITEM_CLASS_NAMES[className]} key={item}>
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
			<summary className="text-muted-foreground outline-ring cursor-pointer list-inside text-xs font-extrabold focus-visible:rounded-md focus-visible:outline-2 focus-visible:outline-offset-2">
				Raw payload
			</summary>
			<pre className="border-border/70 bg-background/75 text-foreground mt-3 max-h-105 overflow-auto rounded-lg border p-3 font-mono text-xs leading-5">
				{stringify(payload)}
			</pre>
		</details>
	);
}
