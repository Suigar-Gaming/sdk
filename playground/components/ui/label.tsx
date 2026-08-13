'use client';

import * as LabelPrimitive from '@radix-ui/react-label';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
	return (
		<LabelPrimitive.Root
			data-slot="label"
			className={cn(
				'flex items-center text-sm leading-none font-medium gap-2 group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:opacity-50 select-none peer-disabled:cursor-not-allowed',
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
