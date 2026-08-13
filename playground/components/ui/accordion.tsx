'use client';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

function Accordion({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Root>) {
	return (
		<AccordionPrimitive.Root
			data-slot="accordion"
			className={cn('flex w-full flex-col', className)}
			{...props}
		/>
	);
}

function AccordionItem({
	className,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
	return (
		<AccordionPrimitive.Item
			data-slot="accordion-item"
			className={cn('not-last:border-b', className)}
			{...props}
		/>
	);
}

function AccordionTrigger({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
	return (
		<AccordionPrimitive.Header className="flex">
			<AccordionPrimitive.Trigger
				data-slot="accordion-trigger"
				className={cn(
					'relative flex flex-1 items-start justify-between **:data-[slot=accordion-trigger-icon]:size-4 text-sm font-medium hover:underline py-2.5 disabled:pointer-events-none **:data-[slot=accordion-trigger-icon]:ml-auto border-transparent text-left outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:text-muted-foreground group/accordion-trigger rounded-lg border transition-all',
					className,
				)}
				{...props}
			>
				{children}
				<ChevronDown
					data-slot="accordion-trigger-icon"
					className="shrink-0 group-aria-expanded/accordion-trigger:hidden pointer-events-none"
				/>
				<ChevronUp
					data-slot="accordion-trigger-icon"
					className="hidden shrink-0 group-aria-expanded/accordion-trigger:inline pointer-events-none"
				/>
			</AccordionPrimitive.Trigger>
		</AccordionPrimitive.Header>
	);
}

function AccordionContent({
	className,
	children,
	...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
	return (
		<AccordionPrimitive.Content
			data-slot="accordion-content"
			className="data-closed:overflow-hidden text-sm data-open:animate-accordion-down data-closed:animate-accordion-up"
			{...props}
		>
			<div
				className={cn(
					'[&_a]:underline [&_a]:underline-offset-3 pt-0 pb-2.5 [&_p:not(:last-child)]:mb-4 [&_a]:hover:text-foreground',
					className,
				)}
			>
				{children}
			</div>
		</AccordionPrimitive.Content>
	);
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
