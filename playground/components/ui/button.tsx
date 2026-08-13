import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
	"inline-flex shrink-0 items-center justify-center [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 text-sm font-medium whitespace-nowrap disabled:pointer-events-none [&_svg]:pointer-events-none border-transparent bg-clip-padding outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 group/button cursor-pointer rounded-lg border transition-all select-none active:not-aria-[haspopup]:translate-y-px",
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground [a]:hover:bg-primary/80',
				control:
					'border-border/70 bg-background/80 text-foreground shadow-sm hover:border-primary/35 hover:bg-primary/12 hover:text-foreground dark:border-primary/45 dark:bg-accent/70 dark:text-foreground dark:shadow-[0_0_0_1px_rgba(255,181,71,0.10)] dark:hover:border-primary/70 dark:hover:bg-primary/38 dark:hover:text-primary-foreground',
				'control-active':
					'border-primary/55 bg-primary text-primary-foreground shadow-sm hover:bg-primary/88 dark:border-primary/80 dark:bg-primary dark:text-primary-foreground dark:shadow-[0_0_0_1px_rgba(255,181,71,0.28),0_10px_24px_-14px_rgba(255,181,71,0.45)] dark:hover:bg-primary/94',
				outline:
					'border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
				ghost:
					'hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50',
				destructive:
					'bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default:
					'h-10 gap-2 rounded-xl px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3',
				xs: "h-7 gap-1 rounded-lg px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-9 gap-1.5 rounded-xl px-3 text-sm in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
				lg: 'h-11 gap-2 rounded-xl px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
				icon: 'size-10 rounded-xl',
				'icon-xs':
					"size-7 rounded-lg in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
				'icon-sm': 'size-8 rounded-xl in-data-[slot=button-group]:rounded-lg',
				'icon-lg': 'size-11 rounded-xl',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

function Button({
	className,
	variant = 'default',
	size = 'default',
	asChild = false,
	...props
}: React.ComponentProps<'button'> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? Slot : 'button';

	return (
		<Comp
			data-slot="button"
			data-variant={variant}
			data-size={size}
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button };
