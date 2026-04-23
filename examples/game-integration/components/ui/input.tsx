import * as React from 'react';
import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				'flex h-11 w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring/60',
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
