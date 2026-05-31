'use client';

import * as React from 'react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTheme } from '@/components/providers/theme-provider';

function subscribeToMobileViewport(onStoreChange: () => void) {
	if (typeof window === 'undefined') {
		return () => {};
	}

	const mediaQuery = window.matchMedia('(max-width: 640px)');
	mediaQuery.addEventListener('change', onStoreChange);

	return () => {
		mediaQuery.removeEventListener('change', onStoreChange);
	};
}

function getMobileViewportSnapshot() {
	return window.matchMedia('(max-width: 640px)').matches;
}

function Toaster({ ...props }: ToasterProps) {
	const { theme = 'system' } = useTheme();
	const isMobile = React.useSyncExternalStore(
		subscribeToMobileViewport,
		getMobileViewportSnapshot,
		() => false,
	);

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			position={isMobile ? 'top-center' : 'bottom-right'}
			closeButton
			className="toaster group"
			toastOptions={{
				classNames: {
					toast:
						'group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
					description: 'group-[.toast]:text-muted-foreground',
					actionButton:
						'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
					cancelButton:
						'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
				},
			}}
			{...props}
		/>
	);
}

export { Toaster };
