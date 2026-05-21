'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function FormSkeleton() {
	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2">
				<div className="space-y-2">
					<Skeleton className="h-4 w-28" />
					<Skeleton className="h-11 rounded-2xl" />
				</div>
				<div className="space-y-2 pt-1">
					<div className="flex items-center justify-between gap-3">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-6 w-10 rounded-full" />
					</div>
					<Skeleton className="h-4 w-40" />
				</div>
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-20" />
				<Skeleton className="h-11 rounded-2xl" />
			</div>
			<div className="space-y-2">
				<Skeleton className="h-4 w-44" />
				<Skeleton className="h-4 w-72" />
			</div>
		</div>
	);
}
