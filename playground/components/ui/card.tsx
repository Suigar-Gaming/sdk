import * as React from 'react';

import { cn } from '@/lib/utils';

function Card({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="card"
			className={cn(
				'border-border/70 bg-card/80 shadow-[0_24px_70px_-40px_rgba(0,0,0,0.45)] rounded-3xl border backdrop-blur-xl',
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
			className={cn('flex flex-col items-start gap-2 p-6', className)}
			{...props}
		/>
	);
}

function CardTitle({
	className,
	children,
	...props
}: React.ComponentProps<'h3'> & {
	children: React.ReactNode;
}) {
	return (
		<h3
			data-slot="card-title"
			className={cn('text-lg font-semibold tracking-tight', className)}
			{...props}
		>
			{children}
		</h3>
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
	return <div data-slot="card-content" className={cn('p-6 pt-0', className)} {...props} />;
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

export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };
