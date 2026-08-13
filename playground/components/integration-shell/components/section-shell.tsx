'use client';

import type * as React from 'react';

import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

export function SectionShell({
	title,
	description,
	icon,
	action,
	children,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Card className="h-full shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader className="flex-row items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					<CardTitle className="flex items-center gap-2">
						{icon}
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				{action ? <CardAction className="shrink-0">{action}</CardAction> : null}
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}
