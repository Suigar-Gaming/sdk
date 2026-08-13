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
				'relative inline-flex shrink-0 items-center after:absolute data-[size=default]:h-6 data-[size=default]:w-10 data-[size=sm]:h-5 data-[size=sm]:w-8 peer p-0.5 border-transparent shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring/60 aria-invalid:border-destructive aria-invalid:ring-2 aria-invalid:ring-destructive/30 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input/70 disabled:opacity-50 group/switch rounded-full border transition-colors after:-inset-x-3 after:-inset-y-2 disabled:cursor-not-allowed',
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb
				data-slot="switch-thumb"
				className="block group-data-[size=default]/switch:size-5 group-data-[size=sm]/switch:size-4 pointer-events-none bg-white shadow-sm ring-0 rounded-full transition-transform data-[state=checked]:translate-x-4 group-data-[size=sm]/switch:data-[state=checked]:translate-x-3"
			/>
		</SwitchPrimitive.Root>
	);
}

export { Switch };
