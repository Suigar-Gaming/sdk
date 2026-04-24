'use client';

import { useCurrentAccount } from '@mysten/dapp-kit-react';
import {
	CheckCircle2,
	LoaderCircle,
	SendHorizontal,
	Swords,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';

type Props = {
	onExecute: () => void;
	isExecuting: boolean;
	status: string | null;
	error: string | null;
};

export function ExecuteTransactionCard({
	onExecute,
	isExecuting,
	status,
	error,
}: Props) {
	const currentAccount = useCurrentAccount();

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<SendHorizontal className="size-5 text-secondary dark:text-primary" />
					Execute transaction
				</CardTitle>
				<CardDescription>
					The connected wallet signs and submits the same transaction shown in
					the code block.
				</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-col items-center gap-4">
					<Button
						size="lg"
						onClick={onExecute}
						disabled={isExecuting || !currentAccount}
					>
						{isExecuting ? (
							<LoaderCircle className="size-4 animate-spin" />
						) : (
							<Swords className="size-4" />
						)}
						Sign and execute transaction
					</Button>
					{status ? (
						<Alert variant="success" className="w-full">
							<CheckCircle2 />
							<AlertTitle>Executed</AlertTitle>
							<AlertDescription className="font-mono text-xs text-foreground break-all">
								{status}
							</AlertDescription>
						</Alert>
					) : null}
				</div>

				{error ? (
					<div className="rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
						{error}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
}
