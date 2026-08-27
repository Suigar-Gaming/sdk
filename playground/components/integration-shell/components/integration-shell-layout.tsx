'use client';

import type * as React from 'react';

type Props = {
	nav: React.ReactNode;
	hero: React.ReactNode;
	controls: React.ReactNode;
	sidebar: React.ReactNode;
	events: React.ReactNode;
	dialog?: React.ReactNode;
	floatingAction?: React.ReactNode;
};

export function IntegrationShellLayout({
	nav,
	hero,
	controls,
	sidebar,
	events,
	dialog,
	floatingAction,
}: Props) {
	return (
		<div className="min-h-dvh">
			<div className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5 md:pt-4 lg:px-8">
				<div className="mx-auto max-w-[1500px]">{nav}</div>
			</div>

			<div className="mx-auto flex min-h-dvh w-full max-w-[1500px] flex-col px-3 pt-20 pb-6 md:px-5 md:pt-24 lg:px-8">
				<main className="mt-2 flex flex-1 flex-col gap-6">
					{hero}
					<div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
						{controls}
						{sidebar}
					</div>
					{events}
				</main>
			</div>

			{dialog}
			{floatingAction}
		</div>
	);
}
