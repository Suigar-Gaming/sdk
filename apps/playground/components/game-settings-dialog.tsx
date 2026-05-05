'use client';

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
import { Card, CardContent } from '@/components/ui/card';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
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
	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				size="xl"
				showCloseButton={false}
				className="flex h-[96vh] w-[min(96vw,1600px)] max-w-[min(96vw,1600px)] flex-col overflow-y-auto border border-border/80 bg-card/92 p-0 shadow-[0_32px_90px_-44px_rgba(8,47,91,0.48)]"
			>
				<DialogHeader className="sticky top-0 z-10 gap-4 border-b border-border/70 bg-card/95 px-4 py-4 md:px-6 md:py-5">
					<div className="flex flex-wrap items-start justify-between gap-3">
						<div className="flex flex-wrap items-center gap-2.5">
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
							<span className="text-lg leading-none">×</span>
						</Button>
					</div>
					<div className="space-y-1">
						<DialogTitle className="w-full text-xl md:text-2xl">
							Live game settings
						</DialogTitle>
						<DialogDescription>
							On-chain parameters for the current standard game selection.
						</DialogDescription>
					</div>
				</DialogHeader>

				<div className="min-h-0 flex-1 px-4 py-4 md:px-6 md:py-6">
					<div className="flex flex-col gap-6 pr-1">
						<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
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

						<Accordion
							type="multiple"
							className="overflow-hidden rounded-2xl border border-border/70 bg-background/30"
							defaultValue={['request']}
						>
							<AccordionItem
								value="request"
								className="border-b border-border/70 px-5 last:border-b-0"
							>
								<AccordionTrigger className="rounded-none border-0 px-0 hover:no-underline">
									Lookup request
								</AccordionTrigger>
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
								<AccordionItem
									value="configs"
									className="border-b border-border/70 px-5 last:border-b-0"
								>
									<AccordionTrigger className="rounded-none border-0 px-0 hover:no-underline">
										Config options
									</AccordionTrigger>
									<AccordionContent className="space-y-3">
										<p className="text-sm text-muted-foreground">
											Playable configs stay enabled in the form selector.
										</p>
										<GameSettingsConfigList configOptions={configOptions} />
									</AccordionContent>
								</AccordionItem>
							) : null}

							<AccordionItem
								value="payload"
								className="border-b border-border/70 px-5 last:border-b-0"
							>
								<AccordionTrigger className="rounded-none border-0 px-0 hover:no-underline">
									Raw payload
								</AccordionTrigger>
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
				</div>
			</DialogContent>
		</Dialog>
	);
}
