'use client';

import { ChevronDown } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

type AccordionContextValue = {
	openItems: Set<string>;
	toggleItem: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(
	null,
);
const AccordionItemContext = React.createContext<string | null>(null);

function useAccordionContext() {
	const context = React.useContext(AccordionContext);
	if (!context) {
		throw new Error('Accordion components must be used within Accordion.');
	}

	return context;
}

function useAccordionItemValue() {
	const value = React.useContext(AccordionItemContext);
	if (!value) {
		throw new Error(
			'AccordionTrigger and AccordionContent must be used within AccordionItem.',
		);
	}

	return value;
}

function Accordion({
	className,
	defaultValue,
	children,
	...props
}: React.ComponentProps<'div'> & {
	defaultValue?: string[];
}) {
	const [openItems, setOpenItems] = React.useState(
		() => new Set(defaultValue ?? []),
	);

	const contextValue = React.useMemo<AccordionContextValue>(
		() => ({
			openItems,
			toggleItem: (value) => {
				setOpenItems((current) => {
					const next = new Set(current);
					if (next.has(value)) {
						next.delete(value);
					} else {
						next.add(value);
					}
					return next;
				});
			},
		}),
		[openItems],
	);

	return (
		<AccordionContext.Provider value={contextValue}>
			<div className={cn('space-y-3', className)} {...props}>
				{children}
			</div>
		</AccordionContext.Provider>
	);
}

function AccordionItem({
	className,
	value,
	children,
	...props
}: React.ComponentProps<'div'> & {
	value: string;
}) {
	return (
		<AccordionItemContext.Provider value={value}>
			<div
				className={cn(
					'overflow-hidden rounded-2xl border border-border/70 bg-background/40',
					className,
				)}
				{...props}
			>
				{children}
			</div>
		</AccordionItemContext.Provider>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<'button'>) {
	const { openItems, toggleItem } = useAccordionContext();
	const value = useAccordionItemValue();
	const isOpen = openItems.has(value);

	return (
		<button
			type="button"
			className={cn(
				'flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent/45',
				className,
			)}
			onClick={() => toggleItem(value)}
			aria-expanded={isOpen}
			{...props}
		>
			<span className="min-w-0 flex-1">{children}</span>
			<ChevronDown
				className={cn(
					'size-4 shrink-0 transition-transform duration-200',
					isOpen && 'rotate-180',
				)}
			/>
		</button>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<'div'>) {
	const { openItems } = useAccordionContext();
	const value = useAccordionItemValue();
	const isOpen = openItems.has(value);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className={cn('border-t border-border/70 px-4 py-4', className)}
			{...props}
		>
			{children}
		</div>
	);
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
