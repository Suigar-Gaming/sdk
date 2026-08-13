import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'flex h-11 w-full min-w-0 file:inline-flex file:h-7 text-sm file:text-sm file:font-medium md:text-sm px-3 py-2 disabled:pointer-events-none border-border/70 bg-background/70 shadow-sm outline-none placeholder:text-muted-foreground/80 selection:bg-primary/20 selection:text-foreground file:border-0 file:bg-transparent disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring/60 aria-invalid:border-destructive rounded-lg border transition-[color,box-shadow,border-color] disabled:cursor-not-allowed',
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
