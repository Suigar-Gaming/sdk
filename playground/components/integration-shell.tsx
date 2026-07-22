'use client';

import {
	useCurrentAccount,
	useCurrentClient,
	useDAppKit,
} from '@mysten/dapp-kit-react';
import { BookOpenText, Cog, Gamepad2, Swords } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { DEFAULT_RANGE_SCALE } from '@suigar/sdk/utils';
import { AppHeader } from '@/components/app-header';
import { EventsTable } from '@/components/events-table';
import { CoinflipForm } from '@/components/forms/games/coinflip-form';
import { LimboForm } from '@/components/forms/games/limbo-form';
import { PlinkoForm } from '@/components/forms/games/plinko-form';
import { PvPCoinflipCancelForm } from '@/components/forms/games/pvp-coinflip-cancel-form';
import { PvPCoinflipCreateForm } from '@/components/forms/games/pvp-coinflip-create-form';
import { PvPCoinflipJoinForm } from '@/components/forms/games/pvp-coinflip-join-form';
import { RangeForm } from '@/components/forms/games/range-form';
import { SoccerForm } from '@/components/forms/games/soccer-form';
import { WheelForm } from '@/components/forms/games/wheel-form';
import {
	CodeSample,
	CodeSampleSkeleton,
} from '@/components/integration-shell/components/code-sample';
import { ExecuteTransactionCard } from '@/components/integration-shell/components/execute-transaction-card';
import { GameSettingsDialog } from '@/components/integration-shell/components/game-settings-dialog';
import { IntegrationShellLayout } from '@/components/integration-shell/components/integration-shell-layout';
import { PvPLobbyPicker } from '@/components/integration-shell/components/pvp-lobby-picker';
import { SectionShell } from '@/components/integration-shell/components/section-shell';
import {
	PvPStakeDescription,
	StakeDescription,
} from '@/components/integration-shell/components/stake-descriptions';
import {
	formatBalance,
	resolveCoinKeyForType,
	type CoinBalanceState,
} from '@/components/integration-shell/helpers/coin';
import { parseError } from '@/components/integration-shell/helpers/errors';
import { stringifyGameParameters } from '@/components/integration-shell/helpers/game-settings';
import {
	getPvPGameLabel,
	getStandardGameLabel,
} from '@/components/integration-shell/helpers/games';
import {
	clampNumber,
	formatInputNumber,
} from '@/components/integration-shell/helpers/numbers';
import {
	getPvPActionFromParams,
	getPvPGameFromParams,
	getStandardGameFromParams,
} from '@/components/integration-shell/helpers/params';
import {
	PVP_ACTION_OPTIONS,
	PVP_GAME_OPTIONS,
	STANDARD_GAME_OPTIONS,
} from '@/components/integration-shell/options';
import { Button } from '@/components/ui/button';
import {
	FieldCode,
	FieldDescription,
	FieldGroup,
	FieldLabel,
} from '@/components/ui/field';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { useEventLog } from '@/hooks/use-event-log';
import { usePersistentForms } from '@/hooks/use-persistent-forms';
import { parseSuigarEvents } from '@/lib/event-parsing';
import {
	findGameConfigOption,
	resolveStakeRangeForGame,
	summarizePvPGameParameters,
	summarizeStandardGameParameters,
} from '@/lib/on-chain-parameters';
import {
	DEFAULT_PVP_FORMS,
	DEFAULT_STANDARD_FORMS,
	getRangePointMax,
	parseOptionalNumber,
} from '@/lib/suigar-app';
import type {
	PvPAction,
	PvPCoinflipForms,
	PvPCoinflipLobbyGame,
	PvPGameId,
	PvPGameParametersSummary,
	StakeRangeSummary,
	StandardForms,
	StandardGameId,
	StandardGameParametersSummary,
	SupportedCoinKey,
} from '@/lib/suigar-types';
import {
	buildPvPPreviewFallback,
	buildPvPTransaction,
	buildStandardTransaction,
	PREVIEW_PLAYER_ADDRESS,
} from '@/lib/transaction-builders';
import { cn } from '@/lib/utils';

type Mode = 'standard' | 'pvp';
type UiState = {
	selectedCoin: SupportedCoinKey;
	status: string | null;
	error: string | null;
	isExecuting: boolean;
	showPrivateJoinLobbies: boolean;
	isGameSettingsDialogOpen: boolean;
};
type CoinBalancesState = {
	coinBalances: Record<SupportedCoinKey, CoinBalanceState>;
	balanceOwner: string | null;
};
type LobbyState = {
	games: PvPCoinflipLobbyGame[];
	error: string | null;
	isLoading: boolean;
};
type StandardParametersState = {
	summary: StandardGameParametersSummary | null;
	payload: unknown;
	error: string | null;
	isLoading: boolean;
};
type PvPParametersState = {
	summary: PvPGameParametersSummary | null;
	payload: unknown;
	error: string | null;
	isLoading: boolean;
};

const DEFAULT_COIN_BALANCES: Record<SupportedCoinKey, CoinBalanceState> = {
	sui: { balance: null, isLoading: false, error: null },
	usdc: { balance: null, isLoading: false, error: null },
};
const initialUiState: UiState = {
	selectedCoin: 'sui',
	status: null,
	error: null,
	isExecuting: false,
	showPrivateJoinLobbies: false,
	isGameSettingsDialogOpen: false,
};
const initialCoinBalancesState: CoinBalancesState = {
	coinBalances: DEFAULT_COIN_BALANCES,
	balanceOwner: null,
};
const initialLobbyState: LobbyState = {
	games: [],
	error: null,
	isLoading: false,
};
const initialStandardParametersState: StandardParametersState = {
	summary: null,
	payload: null,
	error: null,
	isLoading: false,
};
const initialPvPParametersState: PvPParametersState = {
	summary: null,
	payload: null,
	error: null,
	isLoading: false,
};

type UiAction =
	| { type: 'set-selected-coin'; value: SupportedCoinKey }
	| { type: 'set-status'; value: string | null }
	| { type: 'set-error'; value: string | null }
	| { type: 'set-is-executing'; value: boolean }
	| { type: 'set-show-private-join-lobbies'; value: boolean }
	| { type: 'set-is-game-settings-dialog-open'; value: boolean }
	| { type: 'clear-feedback' };
type CoinBalancesAction =
	| { type: 'reset' }
	| { type: 'loading'; coinKeys: SupportedCoinKey[] }
	| {
			type: 'loaded';
			owner: string;
			results: Array<[SupportedCoinKey, CoinBalanceState]>;
	  };
type LobbyAction =
	| { type: 'loading' }
	| { type: 'loaded'; games: PvPCoinflipLobbyGame[] }
	| { type: 'error'; error: string };
type StandardParametersAction =
	| { type: 'loading'; preservePrevious?: boolean }
	| { type: 'loaded'; payload: unknown; summary: StandardGameParametersSummary }
	| { type: 'error'; error: string };
type PvPParametersAction =
	| { type: 'loading'; preservePrevious?: boolean }
	| { type: 'loaded'; payload: unknown; summary: PvPGameParametersSummary }
	| { type: 'error'; error: string }
	| { type: 'reset' };

function uiReducer(state: UiState, action: UiAction): UiState {
	switch (action.type) {
		case 'set-selected-coin':
			return { ...state, selectedCoin: action.value };
		case 'set-status':
			return { ...state, status: action.value };
		case 'set-error':
			return { ...state, error: action.value };
		case 'set-is-executing':
			return { ...state, isExecuting: action.value };
		case 'set-show-private-join-lobbies':
			return { ...state, showPrivateJoinLobbies: action.value };
		case 'set-is-game-settings-dialog-open':
			return { ...state, isGameSettingsDialogOpen: action.value };
		case 'clear-feedback':
			return { ...state, status: null, error: null };
	}
}

function coinBalancesReducer(
	state: CoinBalancesState,
	action: CoinBalancesAction,
): CoinBalancesState {
	switch (action.type) {
		case 'reset':
			return initialCoinBalancesState;
		case 'loading': {
			const nextBalances = { ...state.coinBalances };
			for (const coinKey of action.coinKeys) {
				nextBalances[coinKey] = {
					...nextBalances[coinKey],
					isLoading: true,
					error: null,
				};
			}
			return { ...state, coinBalances: nextBalances };
		}
		case 'loaded': {
			const nextBalances = { ...state.coinBalances };
			for (const [coinKey, value] of action.results) {
				nextBalances[coinKey] = value;
			}
			return {
				balanceOwner: action.owner,
				coinBalances: nextBalances,
			};
		}
	}
}

function lobbyReducer(state: LobbyState, action: LobbyAction): LobbyState {
	switch (action.type) {
		case 'loading':
			return { ...state, isLoading: true, error: null };
		case 'loaded':
			return { games: action.games, error: null, isLoading: false };
		case 'error':
			return { games: [], error: action.error, isLoading: false };
	}
}

function standardParametersReducer(
	state: StandardParametersState,
	action: StandardParametersAction,
): StandardParametersState {
	switch (action.type) {
		case 'loading':
			if (action.preservePrevious) {
				return { ...state, error: null, isLoading: true };
			}
			return { ...initialStandardParametersState, isLoading: true };
		case 'loaded':
			return {
				summary: action.summary,
				payload: action.payload,
				error: null,
				isLoading: false,
			};
		case 'error':
			return { ...initialStandardParametersState, error: action.error };
	}
}

function pvpParametersReducer(
	state: PvPParametersState,
	action: PvPParametersAction,
): PvPParametersState {
	switch (action.type) {
		case 'loading':
			if (action.preservePrevious) {
				return { ...state, error: null, isLoading: true };
			}
			return { ...initialPvPParametersState, isLoading: true };
		case 'loaded':
			return {
				summary: action.summary,
				payload: action.payload,
				error: null,
				isLoading: false,
			};
		case 'error':
			return { ...initialPvPParametersState, error: action.error };
		case 'reset':
			return initialPvPParametersState;
	}
}

function clampStakeValue(stake: string, stakeRange?: StakeRangeSummary) {
	if (!stakeRange) {
		return stake;
	}

	const currentStake = parseOptionalNumber(stake);
	const minStake = parseOptionalNumber(stakeRange.min);
	const maxStake = parseOptionalNumber(stakeRange.max);

	if (
		currentStake === undefined ||
		minStake === undefined ||
		maxStake === undefined
	) {
		return stake;
	}

	if (currentStake < minStake) {
		return stakeRange.min;
	}

	if (stakeRange.kind !== 'minimum' && currentStake > maxStake) {
		return stakeRange.max;
	}

	return stake;
}

function resolvePlayableConfigId(
	currentConfigId: string,
	configOptions?: StandardGameParametersSummary['configOptions'],
) {
	if (!configOptions?.length) {
		return currentConfigId;
	}

	const nextConfig =
		configOptions.find(
			(option) => option.id === currentConfigId && option.isPlayable,
		) ??
		configOptions.find((option) => option.isPlayable) ??
		configOptions[0];

	return nextConfig?.id ?? currentConfigId;
}

const floatingActionNode = (
	<div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
		<Button
			asChild
			className="h-12 rounded-full px-4 shadow-lg md:h-14 md:px-5"
		>
			<a
				href="https://suigar.com/docs/sdk"
				target="_blank"
				rel="noreferrer"
				aria-label="Open SDK Docs in a new tab"
				title="SDK Docs"
			>
				<BookOpenText className="size-5 md:size-6" />
				SDK Docs
			</a>
		</Button>
	</div>
);
const eventsNode = <EventsTable />;

function subscribe() {
	return () => {};
}

function IntegrationHero({
	mode,
	standardGame,
	pvpGame,
	pvpAction,
	onStandardGameChange,
	onPvPGameChange,
	onPvPActionChange,
}: {
	mode: Mode;
	standardGame: StandardGameId;
	pvpGame: PvPGameId;
	pvpAction: PvPAction;
	onStandardGameChange: (value: StandardGameId) => void;
	onPvPGameChange: (value: PvPGameId) => void;
	onPvPActionChange: (value: PvPAction) => void;
}) {
	return (
		<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 px-4 py-4 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl md:rounded-4xl md:px-5 md:py-5 dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<div className="relative flex flex-col gap-4">
				<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
					<div className="space-y-2">
						<h1 className="text-2xl leading-none text-foreground md:text-4xl xl:text-5xl">
							Suigar SDK playground
						</h1>
						<p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
							Build standard and PvP transactions, inspect the exact builder
							call, execute it, and keep a shared decoded event log.
						</p>
					</div>

					<div className="flex flex-col gap-3 lg:min-w-[360px] lg:items-end">
						<div className="flex flex-wrap items-center gap-2 lg:justify-end">
							<Button
								asChild
								variant={mode === 'standard' ? 'control-active' : 'control'}
								size="sm"
								className="h-10 rounded-full px-4"
							>
								<Link
									href="/standard?game=coinflip"
									scroll={false}
									prefetch={false}
								>
									Standard
								</Link>
							</Button>
							<Button
								asChild
								variant={mode === 'pvp' ? 'control-active' : 'control'}
								size="sm"
								className="h-10 rounded-full px-4"
							>
								<Link
									href="/pvp?game=pvp-coinflip&action=create"
									scroll={false}
									prefetch={false}
								>
									PvP
								</Link>
							</Button>
						</div>

						<div className="flex flex-wrap items-center gap-2">
							{mode === 'standard' ? (
								<div className="w-full sm:w-[12rem]">
									<Select
										value={standardGame}
										onValueChange={onStandardGameChange}
									>
										<SelectTrigger
											aria-label="Select standard game"
											className="h-11 rounded-full border-border/70 bg-background/55 px-4"
										>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STANDARD_GAME_OPTIONS.map((game) => (
												<SelectItem key={game.value} value={game.value}>
													{game.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>
							) : (
								<div className="flex flex-wrap items-center gap-2">
									<div className="w-full sm:w-[13rem]">
										<Select value={pvpGame} onValueChange={onPvPGameChange}>
											<SelectTrigger
												aria-label="Select PvP game"
												className="h-11 rounded-full border-border/70 bg-background/55 px-4"
											>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												{PVP_GAME_OPTIONS.map((game) => (
													<SelectItem key={game.value} value={game.value}>
														{game.label}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
									<div className="flex flex-wrap gap-2">
										{PVP_ACTION_OPTIONS.map((action) => (
											<Button
												key={action.value}
												type="button"
												size="sm"
												variant={
													pvpAction === action.value
														? 'control-active'
														: 'control'
												}
												onClick={() => onPvPActionChange(action.value)}
												className={cn(
													'h-10 justify-start rounded-full px-4',
													pvpAction === action.value && 'shadow-none',
												)}
											>
												<action.icon className="size-4" />
												{action.label}
											</Button>
										))}
									</div>
								</div>
							)}
						</div>
					</div>
				</div>

				<div className="rounded-2xl border border-border/70 bg-background/35 px-4 py-3 text-sm text-muted-foreground">
					Stake inputs use human values like{' '}
					<span className="font-medium text-foreground">1</span> or{' '}
					<span className="font-medium text-foreground">2.5</span> and are
					converted to atomic units in the generated transaction.
				</div>
			</div>
		</section>
	);
}

function IntegrationSidebar({
	currentCode,
	handleExecute,
	isExecuting,
	status,
	error,
}: {
	currentCode: string;
	handleExecute: () => Promise<void>;
	isExecuting: boolean;
	status: string | null;
	error: string | null;
}) {
	return (
		<div className="flex flex-col gap-6">
			<CodeSample code={currentCode} />
			<ExecuteTransactionCard
				onExecute={handleExecute}
				isExecuting={isExecuting}
				status={status}
				error={error}
			/>
		</div>
	);
}

function IntegrationControls({
	mode,
	standardGame,
	pvpAction,
	currentAccount,
	effectiveStandardForms,
	effectivePvpForms,
	standardGameParameters,
	isStandardGameParametersLoading,
	standardGameParametersError,
	stakeDescription,
	limboTargetMultiplierDescription,
	rangeBoundsDescription,
	pvpStakeDescription,
	showPrivateJoinLobbies,
	setShowPrivateJoinLobbies,
	joinLobbyGames,
	cancelLobbyGames,
	pvpLobbyError,
	isPvPLobbyLoading,
	pvpForms,
	coinTypes,
	coinDecimals,
	onRefreshPvPLobbies,
	onSelectPvPLobby,
	onStandardStakeBlur,
	onPvPCreateStakeBlur,
	updateStandardForm,
	updatePvPForm,
	openSettings,
}: {
	mode: Mode;
	standardGame: StandardGameId;
	pvpAction: PvPAction;
	currentAccount: ReturnType<typeof useCurrentAccount>;
	effectiveStandardForms: StandardForms;
	effectivePvpForms: PvPCoinflipForms;
	standardGameParameters: StandardGameParametersSummary | null;
	isStandardGameParametersLoading: boolean;
	standardGameParametersError: string | null;
	stakeDescription: React.ReactNode;
	limboTargetMultiplierDescription: React.ReactNode;
	rangeBoundsDescription: React.ReactNode;
	pvpStakeDescription: React.ReactNode;
	showPrivateJoinLobbies: boolean;
	setShowPrivateJoinLobbies: (value: boolean) => void;
	joinLobbyGames: PvPCoinflipLobbyGame[];
	cancelLobbyGames: PvPCoinflipLobbyGame[];
	pvpLobbyError: string | null;
	isPvPLobbyLoading: boolean;
	pvpForms: PvPCoinflipForms;
	coinTypes: Record<SupportedCoinKey, string>;
	coinDecimals: Record<SupportedCoinKey, number>;
	onRefreshPvPLobbies: () => void;
	onSelectPvPLobby: (
		action: 'join' | 'cancel',
		game: PvPCoinflipLobbyGame,
	) => void;
	onStandardStakeBlur: (game: StandardGameId) => void;
	onPvPCreateStakeBlur: () => void;
	updateStandardForm: <K extends StandardGameId>(
		game: K,
		patch: Partial<StandardForms[K]>,
	) => void;
	updatePvPForm: <K extends PvPAction>(
		action: K,
		patch: Partial<PvPCoinflipForms[K]>,
	) => void;
	openSettings: () => void;
}) {
	const controlsIcon =
		mode === 'standard' ? (
			<Gamepad2 className="size-5 text-secondary dark:text-primary" />
		) : (
			<Swords className="size-5 text-secondary dark:text-primary" />
		);

	return (
		<>
			<h2 className="sr-only">
				{mode === 'standard'
					? `${getStandardGameLabel(standardGame)} playground controls`
					: 'PvP Coinflip playground controls'}
			</h2>
			<SectionShell
				title={
					mode === 'standard'
						? `${getStandardGameLabel(standardGame)} controls`
						: 'PvP Coinflip controls'
				}
				icon={controlsIcon}
				description={
					mode === 'standard'
						? 'Adjust the active game inputs on the left while the transaction builder stays in sync on the right.'
						: 'Create, join, or cancel PvP Coinflip games while keeping the exact transaction builder visible.'
				}
				action={
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={openSettings}
						className="h-10 rounded-full border border-border/70 bg-background/45 px-4 text-muted-foreground hover:bg-accent hover:text-foreground"
					>
						<Cog className="size-4" />
						Settings
					</Button>
				}
			>
				<div className="space-y-6">
					{mode === 'standard' ? (
						<>
							{standardGame === 'coinflip' ? (
								<CoinflipForm
									value={effectiveStandardForms.coinflip}
									onChange={(patch) => updateStandardForm('coinflip', patch)}
									onStakeBlur={() => onStandardStakeBlur('coinflip')}
									stakeDescription={stakeDescription}
									betCountLimit={standardGameParameters?.betCountLimit}
								/>
							) : null}
							{standardGame === 'limbo' ? (
								<LimboForm
									value={effectiveStandardForms.limbo}
									onChange={(patch) => updateStandardForm('limbo', patch)}
									onStakeBlur={() => onStandardStakeBlur('limbo')}
									stakeDescription={stakeDescription}
									targetMultiplierDescription={limboTargetMultiplierDescription}
									betCountLimit={standardGameParameters?.betCountLimit}
								/>
							) : null}
							{standardGame === 'plinko' ? (
								<PlinkoForm
									value={effectiveStandardForms.plinko}
									onChange={(patch) => updateStandardForm('plinko', patch)}
									onStakeBlur={() => onStandardStakeBlur('plinko')}
									configOptions={standardGameParameters?.configOptions}
									isConfigLoading={isStandardGameParametersLoading}
									configError={standardGameParametersError}
									stakeDescription={stakeDescription}
									betCountLimit={standardGameParameters?.betCountLimit}
								/>
							) : null}
							{standardGame === 'range' ? (
								<RangeForm
									value={effectiveStandardForms.range}
									onChange={(patch) => updateStandardForm('range', patch)}
									onStakeBlur={() => onStandardStakeBlur('range')}
									stakeDescription={stakeDescription}
									rangeBoundsDescription={rangeBoundsDescription}
									betCountLimit={standardGameParameters?.betCountLimit}
								/>
							) : null}
							{standardGame === 'soccer' ? (
								<SoccerForm
									value={effectiveStandardForms.soccer}
									onChange={(patch) => updateStandardForm('soccer', patch)}
									onStakeBlur={() => onStandardStakeBlur('soccer')}
									configOptions={standardGameParameters?.configOptions}
									countryOptions={standardGameParameters?.countryOptions}
									isConfigLoading={isStandardGameParametersLoading}
									configError={standardGameParametersError}
									stakeDescription={stakeDescription}
									betCountLimit={standardGameParameters?.betCountLimit}
								/>
							) : null}
							{standardGame === 'wheel' ? (
								<WheelForm
									value={effectiveStandardForms.wheel}
									onChange={(patch) => updateStandardForm('wheel', patch)}
									onStakeBlur={() => onStandardStakeBlur('wheel')}
									configOptions={standardGameParameters?.configOptions}
									isConfigLoading={isStandardGameParametersLoading}
									configError={standardGameParametersError}
									stakeDescription={stakeDescription}
									betCountLimit={standardGameParameters?.betCountLimit}
								/>
							) : null}
						</>
					) : (
						<>
							{pvpAction === 'create' ? (
								<PvPCoinflipCreateForm
									value={pvpForms.create}
									onChange={(patch) => updatePvPForm('create', patch)}
									onStakeBlur={onPvPCreateStakeBlur}
									stakeDescription={pvpStakeDescription}
								/>
							) : null}
							{pvpAction === 'join' ? (
								<>
									<div className="rounded-2xl border border-border/70 bg-background/45 p-4">
										<FieldGroup className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
											<div className="min-w-0 space-y-1">
												<FieldLabel htmlFor="join-private-lobbies">
													Show private lobbies
												</FieldLabel>
												<FieldDescription size="sm">
													Public unresolved lobbies stay visible even when the
													wallet is disconnected
												</FieldDescription>
											</div>
											<Switch
												id="join-private-lobbies"
												size="default"
												className="mt-0.5 justify-self-end self-start"
												checked={showPrivateJoinLobbies}
												onCheckedChange={setShowPrivateJoinLobbies}
											/>
										</FieldGroup>
									</div>
									<PvPLobbyPicker
										title="Open lobbies to join"
										description="Unresolved PvP lobbies are shown here. Selecting one fills the join form and switches the selected coin when needed."
										games={joinLobbyGames}
										selectedGameId={pvpForms.join.gameId}
										isLoading={isPvPLobbyLoading}
										error={pvpLobbyError}
										emptyMessage="No matching unresolved PvP lobbies were found."
										coinTypes={coinTypes}
										formatAmount={formatBalance}
										getCoinDecimals={(value) => {
											const matchingCoinKey = resolveCoinKeyForType(
												value,
												coinTypes,
											);
											return matchingCoinKey
												? coinDecimals[matchingCoinKey]
												: 9;
										}}
										onRefresh={onRefreshPvPLobbies}
										onSelectGame={(game) => onSelectPvPLobby('join', game)}
									/>
									<PvPCoinflipJoinForm value={effectivePvpForms.join} />
								</>
							) : null}
							{pvpAction === 'cancel' ? (
								<>
									<PvPLobbyPicker
										title="Your unresolved lobbies"
										description="Only PvP games created by the connected wallet are shown here. Selecting one fills the cancel form and keeps execution tied to that on-chain game."
										games={cancelLobbyGames}
										selectedGameId={pvpForms.cancel.gameId}
										isLoading={isPvPLobbyLoading}
										error={pvpLobbyError}
										emptyMessage={
											currentAccount
												? 'No matching unresolved PvP lobbies were found.'
												: 'Connect a wallet to load the unresolved PvP lobbies you can cancel.'
										}
										coinTypes={coinTypes}
										formatAmount={formatBalance}
										getCoinDecimals={(value) => {
											const matchingCoinKey = resolveCoinKeyForType(
												value,
												coinTypes,
											);
											return matchingCoinKey
												? coinDecimals[matchingCoinKey]
												: 9;
										}}
										onRefresh={onRefreshPvPLobbies}
										onSelectGame={(game) => onSelectPvPLobby('cancel', game)}
									/>
									<PvPCoinflipCancelForm value={effectivePvpForms.cancel} />
								</>
							) : null}
						</>
					)}
				</div>
			</SectionShell>
		</>
	);
}

const projectCoinMetadata = <TCoin extends string>(
	coinMetadata: Record<TCoin, { coinType: string; decimals: number }>,
) => {
	const coinTypes: Record<TCoin, string> = {} as Record<TCoin, string>;
	const coinDecimals: Record<TCoin, number> = {} as Record<TCoin, number>;

	for (const key in coinMetadata) {
		if (Object.hasOwn(coinMetadata, key)) {
			const coinKey = key as TCoin;
			const metadata = coinMetadata[coinKey];
			coinTypes[coinKey] = metadata.coinType;
			coinDecimals[coinKey] = metadata.decimals;
		}
	}

	return { coinTypes, coinDecimals };
};

function useIntegrationState({
	mode,
	routeParams,
	isRouteReady,
	setRouteSearch,
}: {
	mode: Mode;
	routeParams: URLSearchParams;
	isRouteReady: boolean;
	setRouteSearch: React.Dispatch<React.SetStateAction<string>>;
}) {
	const pathname = usePathname();
	const router = useRouter();
	const dAppKit = useDAppKit();
	const currentClient = useCurrentClient();
	const currentAccount = useCurrentAccount();
	const { addRows } = useEventLog();
	const standardGame = getStandardGameFromParams(routeParams);
	const pvpAction = getPvPActionFromParams(routeParams);
	const pvpGame = getPvPGameFromParams(routeParams);

	const [standardForms, setStandardForms] = usePersistentForms<StandardForms>(
		'suigar-playground:standard-game:forms',
		DEFAULT_STANDARD_FORMS,
	);
	const [pvpForms, setPvpForms] = usePersistentForms<PvPCoinflipForms>(
		'suigar-playground:pvp-game:forms',
		DEFAULT_PVP_FORMS,
	);
	const [uiState, dispatchUi] = React.useReducer(uiReducer, initialUiState);
	const [coinBalancesState, dispatchCoinBalances] = React.useReducer(
		coinBalancesReducer,
		initialCoinBalancesState,
	);
	const [lobbyState, dispatchLobby] = React.useReducer(
		lobbyReducer,
		initialLobbyState,
	);
	const [standardParametersState, dispatchStandardParameters] =
		React.useReducer(standardParametersReducer, initialStandardParametersState);
	const [pvpParametersState, dispatchPvPParameters] = React.useReducer(
		pvpParametersReducer,
		initialPvPParametersState,
	);

	const coinMetadata = currentClient.suigar.getConfig().coins;
	const { coinTypes, coinDecimals } = React.useMemo(
		() => projectCoinMetadata(coinMetadata),
		[coinMetadata],
	);
	const coinOptions = React.useMemo(
		() => Object.entries(coinTypes) as Array<[SupportedCoinKey, string]>,
		[coinTypes],
	);
	const {
		selectedCoin,
		status,
		error,
		isExecuting,
		showPrivateJoinLobbies,
		isGameSettingsDialogOpen,
	} = uiState;
	const effectiveSelectedCoin = coinTypes[selectedCoin]
		? selectedCoin
		: (coinOptions[0]?.[0] ?? 'sui');
	const coinType = coinTypes[effectiveSelectedCoin];
	const coinDecimal = coinDecimals[effectiveSelectedCoin];
	const previewOwner = currentAccount?.address ?? PREVIEW_PLAYER_ADDRESS;
	const visibleStatus = currentAccount ? status : null;
	const { coinBalances, balanceOwner } = coinBalancesState;
	const {
		games: pvpLobbyGames,
		error: pvpLobbyError,
		isLoading: isPvPLobbyLoading,
	} = lobbyState;
	const {
		summary: standardGameParameters,
		payload: standardGameParametersPayload,
		error: standardGameParametersError,
		isLoading: isStandardGameParametersLoading,
	} = standardParametersState;
	const {
		summary: pvpGameParameters,
		payload: pvpGameParametersPayload,
		error: pvpGameParametersError,
		isLoading: isPvPGameParametersLoading,
	} = pvpParametersState;
	const refreshBalances = React.useCallback(async () => {
		if (!isRouteReady) {
			return;
		}

		if (!currentAccount) {
			dispatchCoinBalances({ type: 'reset' });
			return;
		}

		dispatchCoinBalances({
			type: 'loading',
			coinKeys: coinOptions.map(([coinKey]) => coinKey),
		});

		const results: Array<[SupportedCoinKey, CoinBalanceState]> =
			await Promise.all(
				coinOptions.map(async ([coinKey, value]) => {
					try {
						const response = await currentClient.getBalance({
							owner: currentAccount.address,
							coinType: value,
						});
						return [
							coinKey,
							{
								balance: formatBalance(
									BigInt(response.balance.balance),
									coinDecimals[coinKey],
								),
								isLoading: false,
								error: null,
							},
						];
					} catch (balanceError) {
						return [
							coinKey,
							{
								balance: null,
								isLoading: false,
								error: parseError(balanceError),
							},
						];
					}
				}),
			);

		dispatchCoinBalances({
			type: 'loaded',
			owner: currentAccount.address,
			results,
		});
	}, [coinDecimals, coinOptions, currentAccount, currentClient, isRouteReady]);

	React.useEffect(() => {
		void refreshBalances();
	}, [refreshBalances]);

	const refreshStandardGameParameters = React.useCallback(
		async (ignoreCache = false) => {
			if (!isRouteReady) {
				return;
			}

			dispatchStandardParameters({
				type: 'loading',
				preservePrevious: ignoreCache,
			});

			try {
				const parameters = await currentClient.suigar.getGameParameters(
					standardGame,
					{
						coinType,
						ignoreCache,
					},
				);

				dispatchStandardParameters({
					type: 'loaded',
					payload: parameters,
					summary: summarizeStandardGameParameters(
						standardGame,
						parameters,
						coinDecimal,
					),
				});
			} catch (parametersError) {
				dispatchStandardParameters({
					type: 'error',
					error: parseError(parametersError),
				});
			}
		},
		[coinType, coinDecimal, currentClient, isRouteReady, standardGame],
	);

	React.useEffect(() => {
		void refreshStandardGameParameters();
	}, [refreshStandardGameParameters]);

	const refreshPvPGameParameters = React.useCallback(
		async (ignoreCache = false) => {
			if (!isRouteReady) {
				return;
			}

			if (mode !== 'pvp') {
				dispatchPvPParameters({ type: 'reset' });
				return;
			}

			dispatchPvPParameters({
				type: 'loading',
				preservePrevious: ignoreCache,
			});

			try {
				const parameters = await currentClient.suigar.getGameParameters(
					pvpGame,
					{
						coinType,
						ignoreCache,
					},
				);

				dispatchPvPParameters({
					type: 'loaded',
					payload: parameters,
					summary: summarizePvPGameParameters(pvpGame, parameters, coinDecimal),
				});
			} catch (parametersError) {
				dispatchPvPParameters({
					type: 'error',
					error: parseError(parametersError),
				});
			}
		},
		[coinType, coinDecimal, currentClient, isRouteReady, mode, pvpGame],
	);

	React.useEffect(() => {
		void refreshPvPGameParameters();
	}, [refreshPvPGameParameters]);

	const refreshPvPLobbies = React.useCallback(async () => {
		if (!isRouteReady) {
			return;
		}

		if (mode !== 'pvp') {
			return;
		}

		dispatchLobby({ type: 'loading' });

		try {
			const games = await currentClient.suigar.getPvPCoinflipGames({
				limit: 50,
			});
			dispatchLobby({ type: 'loaded', games });
		} catch (lobbyError) {
			dispatchLobby({ type: 'error', error: parseError(lobbyError) });
		}
	}, [currentClient, isRouteReady, mode]);

	React.useEffect(() => {
		void refreshPvPLobbies();
	}, [refreshPvPLobbies]);

	const normalizedCurrentAccount =
		currentAccount?.address.toLowerCase() ?? null;
	const selectedStandardForm =
		standardForms[standardGame] ?? DEFAULT_STANDARD_FORMS[standardGame];
	const activeConfigId =
		standardGame === 'plinko' ||
		standardGame === 'soccer' ||
		standardGame === 'wheel'
			? resolvePlayableConfigId(
					(selectedStandardForm as { configId: string }).configId,
					standardGameParameters?.configOptions,
				)
			: undefined;
	const activeConfigOption = React.useMemo(
		() =>
			activeConfigId
				? findGameConfigOption(standardGameParameters, activeConfigId)
				: null,
		[activeConfigId, standardGameParameters],
	);
	const activeStakeRange = React.useMemo(
		() =>
			resolveStakeRangeForGame(
				standardGame,
				standardGameParameters,
				activeConfigId,
			),
		[activeConfigId, standardGame, standardGameParameters],
	);
	const stakeDescription = React.useMemo(
		() => (
			<StakeDescription
				stakeRange={activeStakeRange}
				isLoading={isStandardGameParametersLoading}
				error={standardGameParametersError}
				effectiveSelectedCoin={effectiveSelectedCoin}
				activeConfigDisabled={Boolean(
					activeConfigOption && !activeConfigOption.isPlayable,
				)}
			/>
		),
		[
			activeConfigOption,
			activeStakeRange,
			effectiveSelectedCoin,
			isStandardGameParametersLoading,
			standardGameParametersError,
		],
	);
	const pvpStakeDescription = React.useMemo(
		() => (
			<PvPStakeDescription
				mode={mode}
				pvpAction={pvpAction}
				stakeRange={pvpGameParameters?.stakeRange}
				isLoading={isPvPGameParametersLoading}
				error={pvpGameParametersError}
				effectiveSelectedCoin={effectiveSelectedCoin}
			/>
		),
		[
			effectiveSelectedCoin,
			isPvPGameParametersLoading,
			mode,
			pvpAction,
			pvpGameParameters,
			pvpGameParametersError,
		],
	);
	const standardGameLabel = getStandardGameLabel(standardGame);
	const pvpGameLabel = getPvPGameLabel(pvpGame);
	const serializedGameSettings = React.useMemo(
		() =>
			mode === 'standard'
				? standardGameParametersPayload
					? stringifyGameParameters(standardGameParametersPayload)
					: null
				: pvpGameParametersPayload
					? stringifyGameParameters(pvpGameParametersPayload)
					: null,
		[mode, pvpGameParametersPayload, standardGameParametersPayload],
	);
	const settingsCallPreview =
		mode === 'standard'
			? `client.suigar.getGameParameters('${standardGame}', { coinType: '${coinType}' })`
			: `client.suigar.getGameParameters('${pvpGame}', { coinType: '${coinType}' })`;
	const settingsSummary =
		mode === 'standard' ? standardGameParameters : pvpGameParameters;
	const settingsError =
		mode === 'standard' ? standardGameParametersError : pvpGameParametersError;
	const isSettingsLoading =
		mode === 'standard'
			? isStandardGameParametersLoading
			: isPvPGameParametersLoading;
	const settingsConfigOptions =
		mode === 'standard' ? standardGameParameters?.configOptions : undefined;
	const settingsGameLabel =
		mode === 'standard' ? standardGameLabel : pvpGameLabel;
	const settingsStakeRange =
		mode === 'standard'
			? (settingsSummary?.stakeRange ?? activeStakeRange)
			: (settingsSummary?.stakeRange ?? null);
	const handleRefreshGameSettings = React.useCallback(() => {
		if (mode === 'standard') {
			void refreshStandardGameParameters(true);
			return;
		}

		void refreshPvPGameParameters(true);
	}, [mode, refreshPvPGameParameters, refreshStandardGameParameters]);
	const limboTargetMultiplierDescription = React.useMemo(() => {
		if (
			standardGame !== 'limbo' ||
			!standardGameParameters?.targetMultiplierRange
		) {
			return null;
		}

		return (
			<FieldDescription size="sm">
				On-chain target multiplier range:{' '}
				<FieldCode>
					{formatInputNumber(standardGameParameters.targetMultiplierRange.min)}
				</FieldCode>{' '}
				to{' '}
				<FieldCode>
					{formatInputNumber(standardGameParameters.targetMultiplierRange.max)}
				</FieldCode>
			</FieldDescription>
		);
	}, [standardGame, standardGameParameters]);
	const rangeBoundsDescription = React.useMemo(() => {
		if (standardGame !== 'range' || !standardGameParameters?.rangeBounds) {
			return null;
		}

		const configuredScale = parseOptionalNumber(standardForms.range.scale);
		const effectiveScale =
			configuredScale && Number.isFinite(configuredScale) && configuredScale > 0
				? configuredScale
				: DEFAULT_RANGE_SCALE;

		return (
			<FieldDescription size="sm">
				On-chain zone size:{' '}
				<FieldCode>
					{formatInputNumber(
						standardGameParameters.rangeBounds.minZoneSize / effectiveScale,
					)}
				</FieldCode>{' '}
				to{' '}
				<FieldCode>
					{formatInputNumber(
						standardGameParameters.rangeBounds.maxZoneSize / effectiveScale,
					)}
				</FieldCode>{' '}
				with RTP from{' '}
				<FieldCode>
					{formatInputNumber(standardGameParameters.rangeBounds.minRtp)}
				</FieldCode>{' '}
				to{' '}
				<FieldCode>
					{formatInputNumber(standardGameParameters.rangeBounds.maxRtp)}
				</FieldCode>
			</FieldDescription>
		);
	}, [standardGame, standardGameParameters, standardForms.range.scale]);

	const effectiveStandardForms = React.useMemo<StandardForms>(() => {
		const nextForms: StandardForms = {
			coinflip: {
				...DEFAULT_STANDARD_FORMS.coinflip,
				...standardForms.coinflip,
			},
			limbo: { ...DEFAULT_STANDARD_FORMS.limbo, ...standardForms.limbo },
			plinko: { ...DEFAULT_STANDARD_FORMS.plinko, ...standardForms.plinko },
			range: { ...DEFAULT_STANDARD_FORMS.range, ...standardForms.range },
			soccer: { ...DEFAULT_STANDARD_FORMS.soccer, ...standardForms.soccer },
			wheel: { ...DEFAULT_STANDARD_FORMS.wheel, ...standardForms.wheel },
		};

		if (standardGame === 'plinko') {
			nextForms.plinko.configId = resolvePlayableConfigId(
				standardForms.plinko.configId,
				standardGameParameters?.configOptions,
			);
		}

		if (standardGame === 'wheel') {
			nextForms.wheel.configId = resolvePlayableConfigId(
				standardForms.wheel.configId,
				standardGameParameters?.configOptions,
			);
		}

		if (standardGame === 'soccer') {
			nextForms.soccer.configId = resolvePlayableConfigId(
				nextForms.soccer.configId,
				standardGameParameters?.configOptions,
			);
		}

		const betCountLimit = standardGameParameters?.betCountLimit;
		if (betCountLimit) {
			const form = nextForms[standardGame];
			const betCount = form.betCount.trim();
			if (betCountLimit.max === BigInt(1)) {
				form.betCount = '1';
			} else if (
				/^\d+$/.test(betCount) &&
				BigInt(betCount) > betCountLimit.max
			) {
				form.betCount = betCountLimit.max.toString();
			}
		}

		if (standardGameParameters?.targetMultiplierRange) {
			const targetMultiplier = parseOptionalNumber(
				standardForms.limbo.targetMultiplier,
			);
			if (targetMultiplier !== undefined) {
				const clampedTargetMultiplier = clampNumber(
					targetMultiplier,
					standardGameParameters.targetMultiplierRange.min,
					standardGameParameters.targetMultiplierRange.max,
				);
				nextForms.limbo.targetMultiplier = formatInputNumber(
					clampedTargetMultiplier,
				);
			}
		}

		if (standardGameParameters?.rangeBounds) {
			const configuredScale = parseOptionalNumber(standardForms.range.scale);
			const effectiveScale =
				configuredScale &&
				Number.isFinite(configuredScale) &&
				configuredScale > 0
					? configuredScale
					: DEFAULT_RANGE_SCALE;
			const maxPoint = getRangePointMax(configuredScale);
			const minZoneSize =
				standardGameParameters.rangeBounds.minZoneSize / effectiveScale;
			const maxZoneSize =
				standardGameParameters.rangeBounds.maxZoneSize / effectiveScale;
			const leftPoint = parseOptionalNumber(standardForms.range.leftPoint);
			const rightPoint = parseOptionalNumber(standardForms.range.rightPoint);

			if (leftPoint !== undefined && rightPoint !== undefined) {
				let nextLeftPoint = clampNumber(leftPoint, 0, maxPoint);
				let nextRightPoint = clampNumber(rightPoint, 0, maxPoint);

				if (nextRightPoint < nextLeftPoint) {
					[nextLeftPoint, nextRightPoint] = [nextRightPoint, nextLeftPoint];
				}

				let zoneSize = nextRightPoint - nextLeftPoint;
				if (zoneSize < minZoneSize) {
					nextRightPoint = Math.min(maxPoint, nextLeftPoint + minZoneSize);
					if (nextRightPoint - nextLeftPoint < minZoneSize) {
						nextLeftPoint = Math.max(0, nextRightPoint - minZoneSize);
					}
				}

				zoneSize = nextRightPoint - nextLeftPoint;
				if (zoneSize > maxZoneSize) {
					nextRightPoint = Math.min(maxPoint, nextLeftPoint + maxZoneSize);
				}

				nextForms.range.leftPoint = formatInputNumber(nextLeftPoint);
				nextForms.range.rightPoint = formatInputNumber(nextRightPoint);
			}
		}

		return nextForms;
	}, [standardForms, standardGame, standardGameParameters]);

	const effectivePvpForms = React.useMemo(
		() => ({
			create: { ...DEFAULT_PVP_FORMS.create, ...pvpForms.create },
			join: { ...DEFAULT_PVP_FORMS.join, ...pvpForms.join },
			cancel: { ...DEFAULT_PVP_FORMS.cancel, ...pvpForms.cancel },
		}),
		[pvpForms],
	);

	const joinLobbyGames = React.useMemo(
		() =>
			pvpLobbyGames.filter((game) => {
				if (!showPrivateJoinLobbies && game.is_private) {
					return false;
				}

				if (!normalizedCurrentAccount) {
					return true;
				}

				return game.creator.toLowerCase() !== normalizedCurrentAccount;
			}),
		[pvpLobbyGames, normalizedCurrentAccount, showPrivateJoinLobbies],
	);
	const cancelLobbyGames = React.useMemo(
		() =>
			normalizedCurrentAccount
				? pvpLobbyGames.filter(
						(game) => game.creator.toLowerCase() === normalizedCurrentAccount,
					)
				: [],
		[pvpLobbyGames, normalizedCurrentAccount],
	);
	const isMissingPvPGameSelection =
		mode === 'pvp' &&
		(pvpAction === 'join' || pvpAction === 'cancel') &&
		!effectivePvpForms[pvpAction].gameId.trim();

	let currentCode = '';
	try {
		currentCode =
			mode === 'standard'
				? buildStandardTransaction(
						currentClient,
						standardGame,
						effectiveStandardForms[standardGame],
						previewOwner,
						coinDecimal,
						coinType,
					).code
				: isMissingPvPGameSelection
					? buildPvPPreviewFallback(pvpAction, {
							owner: previewOwner,
							coinType,
						})
					: buildPvPTransaction(
							currentClient,
							pvpAction,
							effectivePvpForms[pvpAction],
							previewOwner,
							coinDecimal,
							coinType,
						).code;
	} catch (buildError) {
		currentCode = `// Unable to build sample code yet\n// ${parseError(buildError)}`;
	}

	const updateQuery = React.useCallback(
		(updates: Record<string, string>) => {
			const params = new URLSearchParams(routeParams.toString());
			for (const [key, value] of Object.entries(updates)) {
				params.set(key, value);
			}
			const nextSearch = params.toString();
			setRouteSearch(nextSearch ? `?${nextSearch}` : '');
			router.replace(`${pathname}${nextSearch ? `?${nextSearch}` : ''}`, {
				scroll: false,
			});
		},
		[pathname, routeParams, router, setRouteSearch],
	);

	function updateStandardForm<K extends StandardGameId>(
		game: K,
		patch: Partial<StandardForms[K]>,
	) {
		dispatchUi({ type: 'clear-feedback' });
		setStandardForms((current) => ({
			...current,
			[game]: { ...DEFAULT_STANDARD_FORMS[game], ...current[game], ...patch },
		}));
	}

	function updatePvPForm<K extends PvPAction>(
		action: K,
		patch: Partial<PvPCoinflipForms[K]>,
	) {
		dispatchUi({ type: 'clear-feedback' });
		setPvpForms((current) => ({
			...current,
			[action]: { ...current[action], ...patch },
		}));
	}

	function handleStandardStakeBlur(game: StandardGameId) {
		if (!activeStakeRange) {
			return;
		}

		setStandardForms((current) => {
			const currentGameForm = current[game];
			const nextStake = clampStakeValue(
				currentGameForm.stake,
				activeStakeRange,
			);

			if (nextStake === currentGameForm.stake) {
				return current;
			}

			return {
				...current,
				[game]: {
					...currentGameForm,
					stake: nextStake,
				},
			};
		});
	}

	function handlePvPCreateStakeBlur() {
		if (!pvpGameParameters?.stakeRange) {
			return;
		}

		setPvpForms((current) => {
			const nextStake = clampStakeValue(
				current.create.stake,
				pvpGameParameters.stakeRange,
			);

			if (nextStake === current.create.stake) {
				return current;
			}

			return {
				...current,
				create: {
					...current.create,
					stake: nextStake,
				},
			};
		});
	}

	function handleSelectPvPLobby(
		action: 'join' | 'cancel',
		game: PvPCoinflipLobbyGame,
	) {
		updatePvPForm(action, { gameId: game.id });
		const matchingCoinKey = resolveCoinKeyForType(game.coin_type, coinTypes);
		if (matchingCoinKey) {
			dispatchUi({ type: 'set-selected-coin', value: matchingCoinKey });
		}
		dispatchUi({ type: 'clear-feedback' });
	}

	async function handleExecute() {
		if (!currentAccount) {
			dispatchUi({
				type: 'set-error',
				value: 'Connect a wallet before executing a transaction.',
			});
			return;
		}

		dispatchUi({ type: 'clear-feedback' });
		dispatchUi({ type: 'set-is-executing', value: true });

		try {
			if (mode === 'pvp' && isMissingPvPGameSelection) {
				throw new Error(
					`Select a PvP lobby card before trying to ${pvpAction} a game.`,
				);
			}

			const owner = currentAccount.address;
			const buildResult =
				mode === 'standard'
					? buildStandardTransaction(
							currentClient,
							standardGame,
							effectiveStandardForms[standardGame],
							owner,
							coinDecimal,
							coinType,
						)
					: buildPvPTransaction(
							currentClient,
							pvpAction,
							effectivePvpForms[pvpAction],
							owner,
							coinDecimal,
							coinType,
						);

			const execution = await dAppKit.signAndExecuteTransaction({
				transaction: buildResult.transaction,
			});

			if (execution.$kind === 'FailedTransaction') {
				throw new Error(execution.FailedTransaction.status.error?.message);
			}

			const digest = execution.Transaction.digest;
			dispatchUi({ type: 'set-status', value: digest });

			const finalResult = await currentClient.waitForTransaction({
				digest,
				include: {
					events: true,
				},
			});

			if (finalResult.$kind === 'FailedTransaction') {
				throw new Error(finalResult.FailedTransaction.status.error?.message);
			}

			const rows = parseSuigarEvents(
				currentClient,
				digest,
				finalResult.Transaction.events,
			);
			if (rows.length > 0) {
				addRows(rows);
			}

			if (mode === 'pvp' && (pvpAction === 'join' || pvpAction === 'cancel')) {
				setPvpForms((current) => ({
					...current,
					[pvpAction]: { ...DEFAULT_PVP_FORMS[pvpAction] },
				}));
			}

			await Promise.all([refreshBalances(), refreshPvPLobbies()]);
		} catch (executionError) {
			dispatchUi({ type: 'set-error', value: parseError(executionError) });
		} finally {
			dispatchUi({ type: 'set-is-executing', value: false });
		}
	}
	const navNode = React.useMemo(
		() => (
			<AppHeader
				selectedCoin={effectiveSelectedCoin}
				onSelectedCoinChange={(value) =>
					dispatchUi({ type: 'set-selected-coin', value })
				}
				coinBalances={coinBalances}
				balanceOwner={balanceOwner}
			/>
		),
		[balanceOwner, coinBalances, effectiveSelectedCoin],
	);

	return {
		navNode,
		standardGame,
		pvpGame,
		pvpAction,
		currentAccount,
		effectiveStandardForms,
		effectivePvpForms,
		standardGameParameters,
		isStandardGameParametersLoading,
		standardGameParametersError,
		stakeDescription,
		limboTargetMultiplierDescription,
		rangeBoundsDescription,
		pvpStakeDescription,
		showPrivateJoinLobbies,
		joinLobbyGames,
		cancelLobbyGames,
		pvpLobbyError,
		isPvPLobbyLoading,
		pvpForms,
		coinTypes,
		coinDecimals,
		currentCode,
		handleExecute,
		handleStandardStakeBlur,
		handlePvPCreateStakeBlur,
		isExecuting,
		visibleStatus,
		error,
		activeConfigOption,
		settingsStakeRange,
		effectiveSelectedCoin,
		settingsConfigOptions,
		settingsError,
		settingsGameLabel,
		isSettingsLoading,
		isGameSettingsDialogOpen,
		serializedGameSettings,
		settingsCallPreview,
		settingsSummary,
		updateStandardForm,
		updatePvPForm,
		handleSelectPvPLobby,
		handleRefreshGameSettings,
		refreshPvPLobbies,
		updateQuery,
		setShowPrivateJoinLobbies: (value: boolean) =>
			dispatchUi({
				type: 'set-show-private-join-lobbies',
				value,
			}),
		openSettings: () =>
			dispatchUi({
				type: 'set-is-game-settings-dialog-open',
				value: true,
			}),
		closeSettings: () =>
			dispatchUi({
				type: 'set-is-game-settings-dialog-open',
				value: false,
			}),
	};
}

const loadingNavNode = <AppHeader />;

const loadingHeroNode = (
	<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 px-4 py-4 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl md:rounded-4xl md:px-5 md:py-5 dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
		<div className="relative flex flex-col gap-4">
			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
				<div className="space-y-2">
					<Skeleton className="h-10 w-56 rounded-full md:h-12 md:w-80" />
					<Skeleton className="h-5 w-full max-w-2xl rounded-full" />
					<Skeleton className="h-5 w-5/6 max-w-xl rounded-full" />
				</div>
				<div className="flex flex-col gap-3 lg:min-w-[360px] lg:items-end">
					<div className="flex flex-wrap items-center gap-2 lg:justify-end">
						<Skeleton className="h-10 w-28 rounded-full" />
						<Skeleton className="h-10 w-20 rounded-full" />
					</div>
					<Skeleton className="h-11 w-full rounded-full sm:w-[12rem]" />
				</div>
			</div>
			<Skeleton className="h-14 rounded-2xl" />
		</div>
	</section>
);

const loadingControlsNode = (
	<SectionShell
		title="Loading controls"
		icon={<Gamepad2 className="size-5 text-secondary dark:text-primary" />}
		description="Preparing the current route state and playground controls."
	>
		<div className="space-y-4">
			<Skeleton className="h-24 rounded-2xl" />
			<Skeleton className="h-24 rounded-2xl" />
			<Skeleton className="h-24 rounded-2xl" />
		</div>
	</SectionShell>
);

const loadingSidebarNode = (
	<div className="flex flex-col gap-6">
		<CodeSampleSkeleton />
		<Skeleton className="h-56 rounded-3xl" />
	</div>
);

const loadingEventsNode = <Skeleton className="h-72 rounded-3xl" />;

function IntegrationLoadingState() {
	return (
		<IntegrationShellLayout
			nav={loadingNavNode}
			hero={loadingHeroNode}
			controls={loadingControlsNode}
			sidebar={loadingSidebarNode}
			events={loadingEventsNode}
			floatingAction={floatingActionNode}
		/>
	);
}

function IntegrationContent({ mode }: { mode: Mode }) {
	const isMounted = React.useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
	const [routeSearch, setRouteSearch] = React.useState(() =>
		typeof window === 'undefined' ? '' : window.location.search,
	);

	React.useEffect(() => {
		if (!isMounted) {
			return;
		}

		const syncRouteSearch = () => {
			setRouteSearch(window.location.search);
		};

		window.addEventListener('popstate', syncRouteSearch);
		return () => {
			window.removeEventListener('popstate', syncRouteSearch);
		};
	}, [isMounted]);

	const routeParams = React.useMemo(
		() => new URLSearchParams(routeSearch),
		[routeSearch],
	);
	const integration = useIntegrationState({
		mode,
		routeParams,
		isRouteReady: isMounted,
		setRouteSearch,
	});

	if (!isMounted) {
		return <IntegrationLoadingState />;
	}

	return (
		<IntegrationShellLayout
			nav={integration.navNode}
			hero={
				<IntegrationHero
					mode={mode}
					standardGame={integration.standardGame}
					pvpGame={integration.pvpGame}
					pvpAction={integration.pvpAction}
					onStandardGameChange={(value) =>
						integration.updateQuery({ game: value })
					}
					onPvPGameChange={(value) => integration.updateQuery({ game: value })}
					onPvPActionChange={(value) => {
						integration.updateQuery({
							game: integration.pvpGame,
							action: value,
						});
					}}
				/>
			}
			controls={
				<IntegrationControls
					mode={mode}
					standardGame={integration.standardGame}
					pvpAction={integration.pvpAction}
					currentAccount={integration.currentAccount}
					effectiveStandardForms={integration.effectiveStandardForms}
					effectivePvpForms={integration.effectivePvpForms}
					standardGameParameters={integration.standardGameParameters}
					isStandardGameParametersLoading={
						integration.isStandardGameParametersLoading
					}
					standardGameParametersError={integration.standardGameParametersError}
					stakeDescription={integration.stakeDescription}
					limboTargetMultiplierDescription={
						integration.limboTargetMultiplierDescription
					}
					rangeBoundsDescription={integration.rangeBoundsDescription}
					pvpStakeDescription={integration.pvpStakeDescription}
					showPrivateJoinLobbies={integration.showPrivateJoinLobbies}
					setShowPrivateJoinLobbies={integration.setShowPrivateJoinLobbies}
					joinLobbyGames={integration.joinLobbyGames}
					cancelLobbyGames={integration.cancelLobbyGames}
					pvpLobbyError={integration.pvpLobbyError}
					isPvPLobbyLoading={integration.isPvPLobbyLoading}
					pvpForms={integration.pvpForms}
					coinTypes={integration.coinTypes}
					coinDecimals={integration.coinDecimals}
					onRefreshPvPLobbies={() => void integration.refreshPvPLobbies()}
					onSelectPvPLobby={integration.handleSelectPvPLobby}
					onStandardStakeBlur={integration.handleStandardStakeBlur}
					onPvPCreateStakeBlur={integration.handlePvPCreateStakeBlur}
					updateStandardForm={integration.updateStandardForm}
					updatePvPForm={integration.updatePvPForm}
					openSettings={integration.openSettings}
				/>
			}
			sidebar={
				<IntegrationSidebar
					currentCode={integration.currentCode}
					handleExecute={integration.handleExecute}
					isExecuting={integration.isExecuting}
					status={integration.visibleStatus}
					error={integration.error}
				/>
			}
			events={eventsNode}
			dialog={
				<GameSettingsDialog
					activeConfigOption={integration.activeConfigOption}
					activeStakeRange={integration.settingsStakeRange}
					coinKey={integration.effectiveSelectedCoin}
					coinLabel={integration.effectiveSelectedCoin.toUpperCase()}
					configOptions={integration.settingsConfigOptions}
					error={integration.settingsError}
					gameLabel={integration.settingsGameLabel}
					isLoading={integration.isSettingsLoading}
					isOpen={integration.isGameSettingsDialogOpen}
					onClose={integration.closeSettings}
					onRefresh={integration.handleRefreshGameSettings}
					serializedGameSettings={integration.serializedGameSettings}
					settingsCallPreview={integration.settingsCallPreview}
					topLevelDetails={integration.settingsSummary?.topLevelDetails}
				/>
			}
			floatingAction={floatingActionNode}
		/>
	);
}

export function StandardIntegrationPage() {
	return <IntegrationContent mode="standard" />;
}

export function PvPIntegrationPage() {
	return <IntegrationContent mode="pvp" />;
}
