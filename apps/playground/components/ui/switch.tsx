'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Switch({
	className,
	size = 'default',
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
	size?: 'sm' | 'default';
}) {
	return (
		<SwitchPrimitive.Root
			data-slot="switch"
			data-size={size}
			className={cn(
				'peer group/switch relative inline-flex shrink-0 items-center rounded-full border p-0.5 transition-all outline-none after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 data-[size=default]:h-6 data-[size=default]:w-11 data-[size=sm]:h-5 data-[size=sm]:w-9 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 data-checked:border-secondary-shadow/30 data-checked:bg-secondary data-unchecked:border-border/80 data-unchecked:bg-background-shadow/20 dark:data-unchecked:border-border dark:data-unchecked:bg-input/70 data-disabled:cursor-not-allowed data-disabled:opacity-50',
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="pointer-events-none block rounded-full border border-black/5 bg-white shadow-sm ring-0 transition-transform group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 group-data-[size=default]/switch:data-checked:translate-x-5 group-data-[size=sm]/switch:data-checked:translate-x-4 group-data-[size=default]/switch:data-unchecked:translate-x-0 group-data-[size=sm]/switch:data-unchecked:translate-x-0 dark:data-unchecked:bg-foreground"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
