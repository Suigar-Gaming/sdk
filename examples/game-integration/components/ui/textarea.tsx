import * as React from 'react';
import { cn } from '@/lib/utils';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
	return (
		<textarea
			data-slot="textarea"
			className={cn(
				'flex min-h-28 w-full rounded-lg border border-border/70 bg-background/70 px-3 py-2 text-sm shadow-sm transition-colors outline-none placeholder:text-muted-foreground/80 focus-visible:ring-2 focus-visible:ring-ring/60',
				className,
			)}
			{...props}
		/>
	);
}

export { Textarea };
