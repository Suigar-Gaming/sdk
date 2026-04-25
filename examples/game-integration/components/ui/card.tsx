import * as React from 'react';
import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card"
			className={cn(
				'rounded-3xl border border-border/70 bg-card/80 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] backdrop-blur-xl',
				className,
			)}
			{...props}
		/>
	);
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-header"
			className={cn(
				'grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 p-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [&>[data-slot=card-action]]:col-start-2 [&>[data-slot=card-action]]:row-span-2 [&>[data-slot=card-action]]:self-start [&>[data-slot=card-action]]:justify-self-end',
				className,
			)}
			{...props}
		/>
	);
}

function CardTitle({ className, ...props }: React.ComponentProps<'h3'>) {
	return (
		<h3
			data-slot="card-title"
			className={cn('text-lg font-semibold tracking-tight', className)}
			{...props}
		/>
	);
}

function CardDescription({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="card-description"
			className={cn('text-sm leading-6 text-muted-foreground', className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-content"
			className={cn('p-6 pt-0', className)}
			{...props}
		/>
	);
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
	return <div data-slot="card-action" className={cn(className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card-footer"
			className={cn('flex items-center p-6 pt-0', className)}
			{...props}
		/>
	);
}

export {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
