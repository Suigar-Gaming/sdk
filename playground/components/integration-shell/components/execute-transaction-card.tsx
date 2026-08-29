'use client';

import { useCurrentAccount } from '@mysten/dapp-kit-react';
import { CheckCircle2, SendHorizontal, Swords } from 'lucide-react';
import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

type Props = {
	onExecute: () => void;
	isExecuting: boolean;
	status: string | null;
	error: string | null;
};

export function ExecuteTransactionCard({ onExecute, isExecuting, status, error }: Props) {
	const currentAccount = useCurrentAccount();
	const isHydrated = React.useSyncExternalStore(
		() => () => {},
		() => true,
		() => false,
	);

	const isExecuteDisabled = !isHydrated || isExecuting || !currentAccount;

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SendHorizontal className="text-secondary dark:text-primary size-5" />
					Execute transaction
				</CardTitle>
				<CardDescription>
					The connected wallet signs and submits the same transaction shown in the code block.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col items-center gap-4">
					<Button
						size="lg"
						className="h-10 rounded-2xl px-5"
						onClick={onExecute}
						disabled={isExecuteDisabled}
					>
						{isExecuting ? (
							<Spinner data-icon="size-4 inline-start" />
						) : (
							<Swords className="size-4" />
						)}
						Sign and execute transaction
					</Button>
					{status ? (
						<Alert variant="success" className="w-full">
							<CheckCircle2 />
							<AlertTitle>Executed</AlertTitle>
							<AlertDescription className="text-foreground font-mono text-xs break-all">
								{status}
							</AlertDescription>
						</Alert>
					) : null}
				</div>

				{error ? (
					<div className="border-destructive/50 bg-destructive/10 text-destructive rounded-2xl border px-4 py-3 text-sm">
						{error}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
