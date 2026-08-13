import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
	'inline-flex w-fit shrink-0 items-center justify-center overflow-hidden [&>svg]:size-3 text-xs font-medium whitespace-nowrap gap-1 px-2 py-0.5 [&>svg]:pointer-events-none border-transparent focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 rounded-full border transition-[color,box-shadow]',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
				secondary:
					'border-secondary/55 bg-secondary/28 text-secondary-foreground [a&]:hover:bg-secondary/34 dark:border-secondary/50 dark:bg-secondary/42',
				success:
					'border-success/70 bg-success/40 text-success-foreground [a&]:hover:bg-success/46 dark:border-success/65 dark:bg-success/52 dark:text-white',
				warning:
					'border-warning/60 bg-warning/28 text-warning-foreground [a&]:hover:bg-warning/34 dark:border-warning/55 dark:bg-warning/42',
				destructive:
					'border-destructive/70 bg-destructive/38 text-destructive-foreground focus-visible:ring-destructive/20 [a&]:hover:bg-destructive/46 dark:border-destructive/65 dark:bg-destructive/52 dark:text-white dark:focus-visible:ring-destructive/40',
				outline:
					'border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
				ghost: '[a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 [a&]:hover:underline',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

function Badge({
	className,
	variant = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : 'span';

	return (
		<Comp
			data-slot="badge"
			data-variant={variant}
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge };
