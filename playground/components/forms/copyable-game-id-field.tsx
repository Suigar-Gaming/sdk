'use client';

import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type CopyableGameIdFieldProps = {
	id: string;
	label: string;
	placeholder: string;
	value: string;
};

async function copyGameId(gameId: string) {
	if (!gameId) {
		return;
	}

	try {
		await navigator.clipboard.writeText(gameId);
		toast.success('Copied game id', {
			description: gameId,
		});
	} catch {
		toast.error('Unable to copy game id');
	}
}

export function CopyableGameIdField({
	id,
	label,
	placeholder,
	value,
}: CopyableGameIdFieldProps) {
	return (
		<Field>
			<FieldLabel htmlFor={id}>{label}</FieldLabel>
			<div className="relative">
				<Input
					id={id}
					placeholder={placeholder}
					value={value}
					readOnly
					aria-readonly="true"
					className="h-11 pl-4 pr-12 font-mono text-xs md:text-sm bg-muted/35 cursor-default rounded-2xl"
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground"
					onClick={() => void copyGameId(value)}
					disabled={!value}
					aria-label="Copy selected PvP game id"
					title="Copy game id"
				>
					<Copy className="size-4" />
				</Button>
			</div>
		</Field>
	);
}
