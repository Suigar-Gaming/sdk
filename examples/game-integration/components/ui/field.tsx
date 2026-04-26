import * as React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
	return (
		<fieldset
			data-slot="field-set"
			className={cn('flex min-w-0 flex-col gap-6', className)}
			{...props}
		/>
	);
}

function FieldLegend({ className, ...props }: React.ComponentProps<'legend'>) {
	return (
		<legend
			data-slot="field-legend"
			className={cn('text-sm font-medium text-foreground', className)}
			{...props}
		/>
	);
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="field-group"
			className={cn('flex min-w-0 items-start gap-4', className)}
			{...props}
		/>
	);
}

function FieldSeparator({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="field-separator"
			className={cn('h-px w-full bg-border/70', className)}
			{...props}
		/>
	);
}

function Field({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="field"
			className={cn(
				'group/field grid w-full content-start self-start gap-2',
				className,
			)}
			{...props}
		/>
	);
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div
			data-slot="field-content"
			className={cn('grid gap-1.5', className)}
			{...props}
		/>
	);
}

function FieldTitle({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="field-title"
			className={cn('text-sm font-medium text-foreground', className)}
			{...props}
		/>
	);
}

function FieldLabel({ className, ...props }: React.ComponentProps<'label'>) {
	return (
		<Label
			data-slot="field-label"
			className={cn(
				'leading-none group-data-disabled/field:opacity-60',
				className,
			)}
			{...props}
		/>
	);
}

function FieldDescription({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="field-description"
			className={cn(
				'text-xs leading-5 text-muted-foreground group-data-disabled/field:opacity-60',
				className,
			)}
			{...props}
		/>
	);
}

function FieldError({ className, ...props }: React.ComponentProps<'p'>) {
	return (
		<p
			data-slot="field-error"
			className={cn('text-xs leading-5 text-destructive', className)}
			{...props}
		/>
	);
}

function FieldCode({ className, ...props }: React.ComponentProps<'code'>) {
	return (
		<code
			data-slot="field-code"
			className={cn(
				'inline-flex rounded-sm bg-background/60 px-1 py-0.5 font-mono text-[0.85em] leading-none text-foreground',
				className,
			)}
			{...props}
		/>
	);
}

export {
	Field,
	FieldCode,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSeparator,
	FieldSet,
	FieldTitle,
};
