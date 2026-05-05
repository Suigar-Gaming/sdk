'use client';

import { X } from 'lucide-react';
import * as React from 'react';
import { CodeBlock } from '@/components/code-block';
import { GameSettingsConfigList } from '@/components/game-settings-config-list';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import { FieldCode } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type {
	GameConfigOption,
	StakeRangeSummary,
	StandardGameId,
} from '@/lib/suigar-types';

function SettingsSummaryCard({
	title,
	value,
	description,
}: {
	title: string;
	value: React.ReactNode;
	description: React.ReactNode;
}) {
	return (
		<Card className="rounded-2xl bg-background/40 shadow-none">
			<CardContent className="p-4">
				<p className="text-[0.72rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
					{title}
				</p>
				<p className="mt-2 flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
					{value}
				</p>
				<p className="mt-1 text-sm text-muted-foreground">{description}</p>
			</CardContent>
		</Card>
	);
}

function SettingsStateCard({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Card className={className}>
			<CardContent className="p-5 text-sm">{children}</CardContent>
		</Card>
	);
}

export function GameSettingsDialog({
	activeConfigOption,
	activeStakeRange,
	coinLabel,
	configOptions,
	error,
	game,
	gameLabel,
	isLoading,
	isOpen,
	onClose,
	serializedGameSettings,
	settingsCallPreview,
}: {
	activeConfigOption: GameConfigOption | null;
	activeStakeRange: StakeRangeSummary | null;
	coinLabel: string;
	configOptions?: GameConfigOption[];
	error: string | null;
	game: StandardGameId;
	gameLabel: string;
	isLoading: boolean;
	isOpen: boolean;
	onClose: () => void;
	serializedGameSettings: string | null;
	settingsCallPreview: string;
}) {
	React.useEffect(() => {
		if (!isOpen) {
			return;
		}

		const previousHtmlOverflow = document.documentElement.style.overflow;
		const previousOverflow = document.body.style.overflow;
		document.documentElement.style.overflow = 'hidden';
		document.body.style.overflow = 'hidden';

		return () => {
			document.documentElement.style.overflow = previousHtmlOverflow;
			document.body.style.overflow = previousOverflow;
		};
	}, [isOpen]);

	if (!isOpen) {
		return null;
	}

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-3 backdrop-blur-sm md:p-6"
			onClick={onClose}
		>
			<div
				role="dialog"
				aria-modal="true"
				aria-labelledby="game-settings-dialog-title"
				className="h-[min(90vh,920px)] w-full max-w-4xl"
				onClick={(event) => event.stopPropagation()}
			>
				<Card className="flex h-full flex-col overflow-hidden border-border/80 bg-card/92 shadow-[0_32px_90px_-44px_rgba(8,47,91,0.48)]">
					<CardHeader className="gap-4 border-b border-border/70">
						<div className="flex flex-wrap items-start justify-between gap-3">
							<div className="flex flex-wrap items-center gap-3">
								<Badge variant="secondary" className="px-3 py-1 text-[0.68rem]">
									{gameLabel}
								</Badge>
								<Badge variant="outline" className="px-3 py-1 text-[0.68rem]">
									{coinLabel}
								</Badge>
								{isLoading ? (
									<Badge
										variant="outline"
										className="gap-1 px-3 py-1 text-[0.68rem] normal-case"
									>
										<Spinner className="size-3.5" data-icon="inline-start" />
										Loading
									</Badge>
								) : null}
								{error ? (
									<Badge
										variant="destructive"
										className="px-3 py-1 text-[0.68rem]"
									>
										Error
									</Badge>
								) : null}
							</div>
							<Button
								type="button"
								variant="ghost"
								size="icon-sm"
								onClick={onClose}
								className="rounded-full"
								aria-label="Close settings dialog"
							>
								<X className="size-4" />
							</Button>
						</div>
						<div className="space-y-1">
							<CardTitle
								id="game-settings-dialog-title"
								className="w-full text-xl md:text-2xl"
							>
								Live game settings
							</CardTitle>
							<CardDescription>
								On-chain parameters for the current standard game selection.
							</CardDescription>
						</div>
					</CardHeader>

					<CardContent className="min-h-0 flex-1 overflow-hidden p-4 md:p-6">
						<div className="flex h-full flex-col gap-6 overflow-y-auto pr-1">
							<div className="grid grid-cols-2 gap-3 md:grid-cols-3">
								<SettingsSummaryCard
									title="Stake range"
									value={
										activeStakeRange ? (
											<>
												<FieldCode>{activeStakeRange.min}</FieldCode>
												<span>to</span>
												<FieldCode>{activeStakeRange.max}</FieldCode>
											</>
										) : (
											'--'
										)
									}
									description={coinLabel}
								/>
								<SettingsSummaryCard
									title="Configs"
									value={configOptions?.length ?? 0}
									description={
										game === 'plinko' || game === 'wheel'
											? 'On-chain config options available for this game.'
											: 'This game uses top-level parameters only.'
									}
								/>
								<SettingsSummaryCard
									title="Selected config"
									value={activeConfigOption?.label ?? 'N/A'}
									description={
										activeConfigOption?.description ??
										'No per-config selection for the current game.'
									}
								/>
							</div>

							<Separator />

							<Accordion>
								<AccordionItem value="request">
									<AccordionTrigger>Lookup request</AccordionTrigger>
									<AccordionContent>
										<CodeBlock
											code={settingsCallPreview}
											copyMode="icon"
											copyTitle="Copy lookup request"
											copyDescription="The lookup request was copied."
										/>
									</AccordionContent>
								</AccordionItem>

								{configOptions?.length ? (
									<AccordionItem value="configs">
										<AccordionTrigger>Config options</AccordionTrigger>
										<AccordionContent className="space-y-3">
											<p className="text-sm text-muted-foreground">
												Playable configs stay enabled in the form selector.
											</p>
											<GameSettingsConfigList configOptions={configOptions} />
										</AccordionContent>
									</AccordionItem>
								) : null}

								<AccordionItem value="payload">
									<AccordionTrigger>Raw payload</AccordionTrigger>
									<AccordionContent>
										{isLoading ? (
											<SettingsStateCard className="inline-flex bg-background/40 text-muted-foreground shadow-none">
												<div className="flex items-center gap-2">
													<Spinner />
													Loading game settings from on-chain parameters.
												</div>
											</SettingsStateCard>
										) : error ? (
											<SettingsStateCard className="border-destructive/40 bg-destructive/10 text-destructive shadow-none">
												{error}
											</SettingsStateCard>
										) : serializedGameSettings ? (
											<CodeBlock
												code={serializedGameSettings}
												copyMode="icon"
												copyTitle="Copy raw payload"
												copyDescription="The raw payload was copied."
											/>
										) : (
											<SettingsStateCard className="bg-background/40 text-muted-foreground shadow-none">
												No game settings are available yet for the current
												selection.
											</SettingsStateCard>
										)}
									</AccordionContent>
								</AccordionItem>
							</Accordion>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
