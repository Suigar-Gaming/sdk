import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'flex h-11 w-full min-w-0 rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm transition-[color,box-shadow,border-color] outline-none placeholder:text-muted-foreground/80 selection:bg-primary/20 selection:text-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:ring-2 focus-visible:ring-ring/60 aria-invalid:border-destructive',
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
