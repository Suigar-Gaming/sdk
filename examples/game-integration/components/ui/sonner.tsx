'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
	const { theme = 'system' } = useTheme();
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const mediaQuery = window.matchMedia('(max-width: 640px)');
		const updateMatches = (event: MediaQueryList | MediaQueryListEvent) => {
			setIsMobile(event.matches);
		};

		updateMatches(mediaQuery);
		mediaQuery.addEventListener('change', updateMatches);

		return () => {
			mediaQuery.removeEventListener('change', updateMatches);
		};
	}, []);

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
