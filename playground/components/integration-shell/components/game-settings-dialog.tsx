'use client';

import { RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { CodeBlock } from '@/components/code-block';
import { CoinIcon } from '@/components/coins';
import { GameSettingsConfigList } from '@/components/integration-shell/components/game-settings-config-list';
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
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import type {
	GameConfigOption,
	GameSettingsDetail,
	StakeRangeSummary,
	SupportedCoinKey,
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
		<Card className="bg-background/40 shadow-none rounded-2xl">
			<CardContent className="p-4">
				<p className="text-xs font-medium uppercase text-muted-foreground">
					{title}
				</p>
				<div className="flex flex-wrap items-center text-lg font-semibold mt-2 gap-2 text-foreground">
					{value}
				</div>
				{description ? (
					<div className="text-sm mt-1 text-muted-foreground">
						{description}
					</div>
				) : null}
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
			<CardContent className="text-sm p-5">{children}</CardContent>
		</Card>
	);
}

function GameSettingsDialogHeader({
	coinKey,
	coinLabel,
	error,
	gameLabel,
	isLoading,
	onClose,
	onRefresh,
}: {
	coinKey: SupportedCoinKey;
	coinLabel: string;
	error: string | null;
	gameLabel: string;
	isLoading: boolean;
	onClose: () => void;
	onRefresh?: () => void;
}) {
	return (
		<DialogHeader className="z-10 gap-4 border-b border-border/70 bg-card/95 px-4 py-4 md:px-6 md:py-5">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="flex flex-wrap items-center gap-2.5">
					<Badge variant="default" className="px-3 py-1">
						{gameLabel}
					</Badge>
					<Badge variant="outline" className="px-3 py-1">
						<span className="inline-flex items-center gap-1">
							<CoinIcon coinKey={coinKey} className="size-3.5" />
							{coinLabel}
						</span>
					</Badge>
					{error ? (
						<Badge variant="destructive" className="px-3 py-1">
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
					<X />
				</Button>
			</div>
			<div className="space-y-1">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<DialogTitle className="text-xl md:text-2xl">
						{gameLabel} live settings
					</DialogTitle>
					{onRefresh ? (
						<Button
							type="button"
							variant="outline"
							size="sm"
							onClick={onRefresh}
							disabled={isLoading}
							className="ml-auto"
						>
							{isLoading ? (
								<Spinner data-icon="size-4 inline-start" />
							) : (
								<RefreshCw className="size-4" />
							)}
							Refresh
						</Button>
					) : null}
				</div>
				<DialogDescription>
					On-chain parameters for {gameLabel} game
				</DialogDescription>
			</div>
		</DialogHeader>
	);
}

function GameSettingsOverview({
	activeConfigOption,
	activeConfigDetails,
	activeMultiplierValues,
	activeStakeRange,
	coinKey,
	coinLabel,
	configOptions,
	hasConfigOptions,
	isStakeMinimum,
	playableConfigCount,
	summarizedTopLevelDetails,
	stakeTitle,
}: {
	activeConfigOption: GameConfigOption | null;
	activeConfigDetails: NonNullable<GameConfigOption['details']>;
	activeMultiplierValues: string[];
	activeStakeRange: StakeRangeSummary | null;
	coinKey: SupportedCoinKey;
	coinLabel: string;
	configOptions?: GameConfigOption[];
	hasConfigOptions: boolean;
	isStakeMinimum: boolean;
	playableConfigCount: number;
	summarizedTopLevelDetails: GameSettingsDetail[];
	stakeTitle: string;
}) {
	return (
		<div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
			<SettingsSummaryCard
				title={stakeTitle}
				value={
					activeStakeRange ? (
						<div className="flex flex-nowrap items-center gap-2 overflow-x-auto">
							<FieldCode className="shrink-0">{activeStakeRange.min}</FieldCode>
							{isStakeMinimum ? null : (
								<>
									<span className="shrink-0">to</span>
									<FieldCode className="shrink-0">
										{activeStakeRange.max}
									</FieldCode>
								</>
							)}
							<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
								<CoinIcon coinKey={coinKey} className="size-4" />
								{coinLabel}
							</span>
						</div>
					) : (
						'--'
					)
				}
				description={
					isStakeMinimum ? 'Each player must stake at least this amount.' : null
				}
			/>
			<SettingsSummaryCard
				title="Configs"
				value={
					configOptions?.length ? (
						<>
							<FieldCode>{configOptions.length}</FieldCode>
							<Badge variant="success">{playableConfigCount} playable</Badge>
						</>
					) : (
						<FieldCode>0</FieldCode>
					)
				}
				description={
					hasConfigOptions ? null : 'This game uses top-level parameters only.'
				}
			/>
			<SettingsSummaryCard
				title={hasConfigOptions ? 'Current config' : 'Top-level fields'}
				value={
					activeConfigOption ? (
						<div className="flex flex-wrap items-center gap-2 text-base">
							<span>{activeConfigOption.label}</span>
							<Popover>
								<PopoverTrigger asChild>
									<Button type="button" variant="outline" size="xs">
										<SlidersHorizontal />
										Details
									</Button>
								</PopoverTrigger>
								<PopoverContent
									align="start"
									className="w-[min(22rem,calc(100vw-3rem))] gap-3 rounded-2xl border border-border/70 bg-popover/98 p-4"
								>
									<div className="space-y-3 text-sm">
										<div className="min-w-0 overflow-x-auto">
											<div className="flex w-max min-w-full flex-nowrap items-center gap-1 text-muted-foreground">
												<span className="shrink-0 font-medium text-foreground">
													Stake range:
												</span>
												<FieldCode className="shrink-0">
													{activeConfigOption.stakeRange.min}
												</FieldCode>
												<span className="shrink-0">to</span>
												<FieldCode className="shrink-0">
													{activeConfigOption.stakeRange.max}
												</FieldCode>
												<span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-xs font-medium uppercase tracking-[0.12em]">
													<CoinIcon coinKey={coinKey} className="size-4" />
													{coinLabel}
												</span>
											</div>
										</div>
										{activeConfigDetails.length ? (
											<div className="space-y-1">
												{activeConfigDetails.map((detail) => (
													<div
														key={`active-config-${detail.label}`}
														className="flex items-center gap-1 text-muted-foreground"
													>
														<span>{detail.label}: </span>
														<FieldCode>{detail.value}</FieldCode>
													</div>
												))}
											</div>
										) : null}
										{activeMultiplierValues.length ? (
											<>
												<div className="mb-2 flex items-center gap-1 text-foreground">
													<span>Multipliers:</span>
													<FieldCode className="font-medium">
														{activeMultiplierValues.length}
													</FieldCode>
												</div>
												<div className="flex flex-wrap gap-1.5">
													{activeMultiplierValues.map((value) => (
														<FieldCode
															key={`active-config-multiplier-${value}`}
															className="shrink-0 justify-center"
														>
															{value}
														</FieldCode>
													))}
												</div>
											</>
										) : null}
									</div>
								</PopoverContent>
							</Popover>
						</div>
					) : summarizedTopLevelDetails.length ? (
						<div className="space-y-1.5 text-sm">
							{summarizedTopLevelDetails.map((detail) => (
								<div
									key={`top-level-${detail.label}`}
									className="flex items-center justify-between gap-3"
								>
									<span className="text-muted-foreground">{detail.label}</span>
									<FieldCode>{detail.value}</FieldCode>
								</div>
							))}
						</div>
					) : (
						<span className="text-base">N/A</span>
					)
				}
				description={
					activeConfigOption || summarizedTopLevelDetails.length
						? null
						: 'No per-config selection for the current game.'
				}
			/>
		</div>
	);
}

function GameSettingsPanels({
	activeConfigOption,
	coinKey,
	configOptions,
	error,
	isLoading,
	serializedGameSettings,
	settingsCallPreview,
}: {
	activeConfigOption: GameConfigOption | null;
	coinKey: SupportedCoinKey;
	configOptions?: GameConfigOption[];
	error: string | null;
	isLoading: boolean;
	serializedGameSettings: string | null;
	settingsCallPreview: string;
}) {
	return (
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
					<AccordionContent className="space-y-1">
						<p className="text-sm text-muted-foreground">
							Playable configs stay enabled in the form selector.
						</p>
						<GameSettingsConfigList
							activeConfigId={activeConfigOption?.id}
							coinKey={coinKey}
							configOptions={configOptions}
						/>
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
							<div className="flex items-center gap-1">
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
							No game settings are available yet for the current selection.
						</SettingsStateCard>
					)}
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
}

export function GameSettingsDialog({
	activeConfigOption,
	activeStakeRange,
	coinKey,
	coinLabel,
	configOptions,
	error,
	gameLabel,
	isLoading,
	isOpen,
	onClose,
	onRefresh,
	serializedGameSettings,
	settingsCallPreview,
	topLevelDetails,
}: {
	activeConfigOption: GameConfigOption | null;
	activeStakeRange: StakeRangeSummary | null;
	coinKey: SupportedCoinKey;
	coinLabel: string;
	configOptions?: GameConfigOption[];
	error: string | null;
	gameLabel: string;
	isLoading: boolean;
	isOpen: boolean;
	onClose: () => void;
	onRefresh?: () => void;
	serializedGameSettings: string | null;
	settingsCallPreview: string;
	topLevelDetails?: GameSettingsDetail[];
}) {
	const playableConfigCount =
		configOptions?.filter((option) => option.isPlayable).length ?? 0;
	const activeConfigDetails = activeConfigOption?.details?.slice(0, 3) ?? [];
	const activeMultiplierValues = activeConfigOption?.multiplierValues ?? [];
	const summarizedTopLevelDetails = topLevelDetails?.slice(0, 3) ?? [];
	const hasConfigOptions = Boolean(configOptions?.length);
	const isStakeMinimum = activeStakeRange?.kind === 'minimum';
	const stakeTitle = isLoading
		? 'Stake'
		: isStakeMinimum
			? 'Stake minimum'
			: 'Stake range';

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent
				size="xl"
				showCloseButton={false}
				className="flex h-[84dvh] w-[min(96vw,1600px)] max-w-[min(96vw,1600px)] flex-col overflow-hidden p-0 border-border/80 bg-card/92 shadow-[0_32px_90px_-44px_rgba(8,47,91,0.48)] border sm:h-[94dvh]"
			>
				<GameSettingsDialogHeader
					coinKey={coinKey}
					coinLabel={coinLabel}
					error={error}
					gameLabel={gameLabel}
					isLoading={isLoading}
					onClose={onClose}
					onRefresh={onRefresh}
				/>

				<div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 md:px-6 md:py-6">
					<div className="flex flex-col gap-6 pr-1">
						<GameSettingsOverview
							activeConfigOption={activeConfigOption}
							activeConfigDetails={activeConfigDetails}
							activeMultiplierValues={activeMultiplierValues}
							activeStakeRange={activeStakeRange}
							coinKey={coinKey}
							coinLabel={coinLabel}
							configOptions={configOptions}
							hasConfigOptions={hasConfigOptions}
							isStakeMinimum={isStakeMinimum}
							playableConfigCount={playableConfigCount}
							summarizedTopLevelDetails={summarizedTopLevelDetails}
							stakeTitle={stakeTitle}
						/>

						<Separator />

						<GameSettingsPanels
							activeConfigOption={activeConfigOption}
							coinKey={coinKey}
							configOptions={configOptions}
							error={error}
							isLoading={isLoading}
							serializedGameSettings={serializedGameSettings}
							settingsCallPreview={settingsCallPreview}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
