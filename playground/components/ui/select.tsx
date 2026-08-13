'use client';

import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
	return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
	return (
		<SelectPrimitive.Group
			data-slot="select-group"
			className={cn('p-1 scroll-my-1', className)}
			{...props}
		/>
	);
}

function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
	return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectTrigger({
	className,
	size = 'default',
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger> & {
	size?: 'sm' | 'default';
}) {
	return (
		<SelectPrimitive.Trigger
			data-slot="select-trigger"
			data-size={size}
			className={cn(
				"flex w-full items-center justify-between data-[size=default]:h-10 data-[size=sm]:h-9 *:data-[slot=select-value]:flex *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:items-center [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 text-sm whitespace-nowrap *:data-[slot=select-value]:line-clamp-1 gap-2 py-2 pr-3 pl-3.5 *:data-[slot=select-value]:gap-1.5 [&_svg]:pointer-events-none border-input bg-background/70 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-placeholder:text-muted-foreground hover:bg-accent hover:text-accent-foreground dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 cursor-pointer rounded-xl border transition-colors select-none disabled:cursor-not-allowed data-[size=sm]:rounded-lg",
				className,
			)}
			{...props}
		>
			{children}
			<SelectPrimitive.Icon asChild>
				<ChevronDown className="size-4 pointer-events-none text-muted-foreground" />
			</SelectPrimitive.Icon>
		</SelectPrimitive.Trigger>
	);
}

function SelectContent({
	className,
	children,
	position = 'popper',
	align = 'center',
	...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
	return (
		<SelectPrimitive.Portal>
			<SelectPrimitive.Content
				data-slot="select-content"
				data-align-trigger={position === 'item-aligned'}
				className={cn(
					'relative z-50 max-h-(--radix-select-content-available-height) min-w-[10rem] overflow-x-hidden overflow-y-auto p-1 border-border/70 bg-popover/98 text-popover-foreground shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] ring-1 ring-foreground/8 origin-(--radix-select-content-transform-origin) rounded-2xl border duration-100 data-[align-trigger=true]:animate-none data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95',
					position === 'popper' &&
						'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
					className,
				)}
				position={position}
				align={align}
				{...props}
			>
				<SelectScrollUpButton />
				<SelectPrimitive.Viewport
					data-position={position}
					className={cn(
						'w-full data-[position=popper]:min-w-(--radix-select-trigger-width)',
						position === 'popper' && '',
					)}
				>
					{children}
				</SelectPrimitive.Viewport>
				<SelectScrollDownButton />
			</SelectPrimitive.Content>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
	return (
		<SelectPrimitive.Label
			data-slot="select-label"
			className={cn('text-xs px-1.5 py-1 text-muted-foreground', className)}
			{...props}
		/>
	);
}

function SelectItem({
	className,
	children,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
	return (
		<SelectPrimitive.Item
			data-slot="select-item"
			className={cn(
				"relative flex w-full items-center [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 text-sm gap-2 py-2 pr-9 pl-3 data-disabled:pointer-events-none [&_svg]:pointer-events-none outline-hidden focus:bg-accent focus:text-accent-foreground data-disabled:opacity-50 cursor-pointer rounded-xl select-none",
				className,
			)}
			{...props}
		>
			<span className="absolute right-2 flex size-4 items-center justify-center pointer-events-none">
				<SelectPrimitive.ItemIndicator>
					<Check className="pointer-events-none" />
				</SelectPrimitive.ItemIndicator>
			</span>
			<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
	return (
		<SelectPrimitive.Separator
			data-slot="select-separator"
			className={cn('h-px pointer-events-none -mx-1 my-1 bg-border', className)}
			{...props}
		/>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	return (
		<SelectPrimitive.ScrollUpButton
			data-slot="select-scroll-up-button"
			className={cn(
				"z-10 flex items-center justify-center [&_svg:not([class*='size-'])]:size-4 py-1 bg-popover cursor-default",
				className,
			)}
			{...props}
		>
			<ChevronUp />
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	return (
		<SelectPrimitive.ScrollDownButton
			data-slot="select-scroll-down-button"
			className={cn(
				"z-10 flex items-center justify-center [&_svg:not([class*='size-'])]:size-4 py-1 bg-popover cursor-default",
				className,
			)}
			{...props}
		>
			<ChevronDown />
		</SelectPrimitive.ScrollDownButton>
	);
}

export {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
};
