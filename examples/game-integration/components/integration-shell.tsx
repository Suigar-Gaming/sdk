'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
	BookOpenText,
	CirclePlus,
	Gamepad2,
	ShieldX,
	Swords,
} from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import {
	useCurrentAccount,
	useCurrentClient,
	useDAppKit,
} from '@mysten/dapp-kit-react';
import { useSearchParams } from 'next/navigation';
import { CoinIcon } from '@/components/coins';
import { CodeSample } from '@/components/code-sample';
import { ExecuteTransactionCard } from '@/components/execute-transaction';
import { EventsTable } from '@/components/events-table';
import { CoinflipForm } from '@/components/games/coinflip-form';
import { LimboForm } from '@/components/games/limbo-form';
import { PlinkoForm } from '@/components/games/plinko-form';
import { PvPCoinflipCancelForm } from '@/components/games/pvp-coinflip-cancel-form';
import { PvPCoinflipCreateForm } from '@/components/games/pvp-coinflip-create-form';
import { PvPCoinflipJoinForm } from '@/components/games/pvp-coinflip-join-form';
import { PvPLobbyPicker } from '@/components/games/pvp-lobby-picker';
import { RangeForm } from '@/components/games/range-form';
import { WheelForm } from '@/components/games/wheel-form';
import { useEventLog } from '@/components/providers/event-log-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
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
import { Switch } from '@/components/ui/switch';
import { parseSuigarEvents } from '@/lib/event-parsing';
import {
	DEFAULT_PVP_FORMS,
	DEFAULT_STANDARD_FORMS,
	COIN_DECIMALS,
	isPvPAction,
	isPvPGame,
	isStandardGame,
} from '@/lib/suigar-app';
import type {
	PvPAction,
	PvPCoinflipLobbyGame,
	PvPCoinflipForms,
	PvPGameId,
	StandardForms,
	StandardGameId,
	SupportedCoinKey,
} from '@/lib/suigar-types';
import {
	buildPvPTransaction,
	buildStandardTransaction,
} from '@/lib/transaction-builders';
import { withBasePath } from '@/lib/paths';
import { cn } from '@/lib/utils';

type Mode = 'standard' | 'pvp';

const STANDARD_GAME_OPTIONS = [
	{ value: 'coinflip', label: 'Coinflip' },
	{ value: 'limbo', label: 'Limbo' },
	{ value: 'plinko', label: 'Plinko' },
	{ value: 'range', label: 'Range' },
	{ value: 'wheel', label: 'Wheel' },
] as const satisfies ReadonlyArray<{ value: StandardGameId; label: string }>;

const PVP_ACTION_OPTIONS = [
	{ value: 'create', label: 'Create', icon: CirclePlus },
	{ value: 'join', label: 'Join', icon: Swords },
	{ value: 'cancel', label: 'Cancel', icon: ShieldX },
] as const satisfies ReadonlyArray<{
	value: PvPAction;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
}>;

const PVP_GAME_OPTIONS = [
	{ value: 'pvp-coinflip', label: 'PvP Coinflip' },
] as const satisfies ReadonlyArray<{ value: PvPGameId; label: string }>;

const PREVIEW_PLAYER_ADDRESS = `0x${'0'.repeat(64)}`;

type CoinBalanceState = {
	balance: string | null;
	isLoading: boolean;
	error: string | null;
};

function formatBalance(balance: bigint, decimals: number) {
	const divisor = BigInt(10) ** BigInt(decimals);
	const whole = balance / divisor;
	const fraction = balance % divisor;
	const paddedFraction = fraction.toString().padStart(decimals, '0');
	const formattedWhole = whole.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
	const fractionDigits = paddedFraction.slice(0, 2).padEnd(2, '0');

	return `${formattedWhole},${fractionDigits}`;
}

function resolveCoinKeyForType(
	coinType: string,
	coinTypes: Record<SupportedCoinKey, string>,
) {
	return (
		(Object.entries(coinTypes) as Array<[SupportedCoinKey, string]>).find(
			([, configuredCoinType]) => configuredCoinType === coinType,
		)?.[0] ?? null
	);
}

function getCoinDisplayAmount({
	currentAccount,
	balanceOwner,
	balanceState,
}: {
	currentAccount: ReturnType<typeof useCurrentAccount>;
	balanceOwner: string | null;
	balanceState: CoinBalanceState;
}) {
	if (!currentAccount) {
		return '--,--';
	}

	if (
		(balanceOwner !== currentAccount.address && !balanceState.error) ||
		balanceState.isLoading ||
		balanceState.error
	) {
		return '--,--';
	}

	return balanceState.balance ?? '0,00';
}

function CoinSelectLabel({
	coinKey,
	amount,
}: {
	coinKey: SupportedCoinKey;
	amount: string;
}) {
	return (
		<div className="flex min-w-0 items-center gap-1 whitespace-nowrap">
			<CoinIcon coinKey={coinKey} className="size-5 shrink-0" />
			<span className="min-w-0 truncate font-medium tabular-nums text-foreground">
				{amount}
			</span>
			<span className="shrink-0 text-[0.65rem] text-muted-foreground md:text-[0.7rem]">
				{coinKey.toUpperCase()}
			</span>
		</div>
	);
}

function usePersistentForms<T>(key: string, initialValue: T) {
	const [value, setValue] = React.useState<T>(() => {
		if (typeof window === 'undefined') {
			return initialValue;
		}

		const raw = window.localStorage.getItem(key);
		if (!raw) {
			return initialValue;
		}

		try {
			return JSON.parse(raw) as T;
		} catch {
			window.localStorage.removeItem(key);
			return initialValue;
		}
	});

	React.useEffect(() => {
		window.localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue] as const;
}

function parseError(error: unknown) {
	if (error instanceof Error) {
		return error.message;
	}

	return 'Unknown error';
}

function getStandardGameFromParams(params: URLSearchParams) {
	const queryGame = params.get('game');
	return isStandardGame(queryGame) ? queryGame : 'coinflip';
}

function getPvPActionFromParams(params: URLSearchParams) {
	const queryAction = params.get('action');
	return isPvPAction(queryAction) ? queryAction : 'create';
}

function getPvPGameFromParams(params: URLSearchParams) {
	const queryGame = params.get('game');
	return isPvPGame(queryGame) ? queryGame : 'pvp-coinflip';
}

function buildPvPPreviewFallback(
	action: 'join' | 'cancel',
	{
		playerAddress,
		coinType,
	}: {
		playerAddress: string;
		coinType: string;
	},
) {
	return [
		`const tx = client.suigar.tx.createPvPCoinflipTransaction('${action}', {`,
		`\tplayerAddress: '${playerAddress}',`,
		`\tcoinType: '${coinType}',`,
		`\tgameId: '0xGAME_ID',`,
		`});`,
	].join('\n');
}

function SectionShell({
	title,
	description,
	icon,
	children,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Card className="h-full border-border/70 bg-card/80 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					{icon}
					{title}
				</CardTitle>
				<CardDescription>{description}</CardDescription>
			</CardHeader>
			<CardContent>{children}</CardContent>
		</Card>
	);
}

function IntegrationContent({ mode }: { mode: Mode }) {
	const searchParams = useSearchParams();
	const dAppKit = useDAppKit();
	const currentClient = useCurrentClient();
	const currentAccount = useCurrentAccount();
	const { addRows } = useEventLog();

	const [standardForms, setStandardForms] = usePersistentForms<StandardForms>(
		'suigar-example-standard-forms-v2',
		DEFAULT_STANDARD_FORMS,
	);
	const [pvpForms, setPvpForms] = usePersistentForms<PvPCoinflipForms>(
		'suigar-example-pvp-forms-v2',
		DEFAULT_PVP_FORMS,
	);
	const [selectedCoin, setSelectedCoin] =
		React.useState<SupportedCoinKey>('sui');
	const [status, setStatus] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [isExecuting, setIsExecuting] = React.useState(false);
	const [pvpLobbyGames, setPvPLobbyGames] = React.useState<
		PvPCoinflipLobbyGame[]
	>([]);
	const [pvpLobbyError, setPvPLobbyError] = React.useState<string | null>(null);
	const [isPvPLobbyLoading, setIsPvPLobbyLoading] = React.useState(false);
	const [pvpLobbyRefreshKey, setPvPLobbyRefreshKey] = React.useState(0);
	const [showPrivateJoinLobbies, setShowPrivateJoinLobbies] =
		React.useState(false);

	const [standardGame, setStandardGame] = React.useState<StandardGameId>(() =>
		getStandardGameFromParams(searchParams),
	);
	const [pvpAction, setPvPAction] = React.useState<PvPAction>(() =>
		getPvPActionFromParams(searchParams),
	);
	const [pvpGame, setPvPGame] = React.useState<PvPGameId>(() =>
		getPvPGameFromParams(searchParams),
	);

	const coinTypes = currentClient.suigar.getConfig().coinTypes;
	const coinOptions = React.useMemo(
		() => Object.entries(coinTypes) as Array<[SupportedCoinKey, string]>,
		[coinTypes],
	);
	const effectiveSelectedCoin = coinTypes[selectedCoin]
		? selectedCoin
		: (coinOptions[0]?.[0] ?? 'sui');
	const coinType = coinTypes[effectiveSelectedCoin];
	const previewPlayerAddress =
		currentAccount?.address ?? PREVIEW_PLAYER_ADDRESS;
	const visibleStatus = currentAccount ? status : null;
	const [coinBalances, setCoinBalances] = React.useState<
		Record<SupportedCoinKey, CoinBalanceState>
	>({
		sui: { balance: null, isLoading: false, error: null },
		usdc: { balance: null, isLoading: false, error: null },
	});
	const [balanceOwner, setBalanceOwner] = React.useState<string | null>(null);
	const [balanceRefreshKey, setBalanceRefreshKey] = React.useState(0);
	const previousModeRef = React.useRef<Mode>(mode);
	const previousStandardGameRef = React.useRef<StandardGameId>(standardGame);
	const previousPvPGameRef = React.useRef<PvPGameId>(pvpGame);
	const previousPvPActionRef = React.useRef<PvPAction>(pvpAction);

	React.useEffect(() => {
		if (typeof window === 'undefined') {
			return;
		}

		const syncFromLocation = () => {
			const params = new URLSearchParams(window.location.search);
			setStandardGame(getStandardGameFromParams(params));
			setPvPAction(getPvPActionFromParams(params));
			setPvPGame(getPvPGameFromParams(params));
		};

		window.addEventListener('popstate', syncFromLocation);
		return () => window.removeEventListener('popstate', syncFromLocation);
	}, []);

	React.useEffect(() => {
		if (!currentAccount) {
			return;
		}

		let cancelled = false;

		const fetchBalances = async () => {
			const results = await Promise.all(
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
									COIN_DECIMALS[coinKey],
								),
								isLoading: false,
								error: null,
							},
						] as const;
					} catch (balanceError) {
						return [
							coinKey,
							{
								balance: null,
								isLoading: false,
								error: parseError(balanceError),
							},
						] as const;
					}
				}),
			);

			if (cancelled) {
				return;
			}

			setBalanceOwner(currentAccount.address);
			setCoinBalances((current) => {
				const next = { ...current };
				for (const [coinKey, state] of results) {
					next[coinKey] = state;
				}
				return next;
			});
		};

		void fetchBalances();

		return () => {
			cancelled = true;
		};
	}, [balanceRefreshKey, coinOptions, currentAccount, currentClient]);

	React.useEffect(() => {
		const previousMode = previousModeRef.current;
		const previousStandardGame = previousStandardGameRef.current;
		const previousPvPGame = previousPvPGameRef.current;
		const previousPvPAction = previousPvPActionRef.current;

		const modeChanged = previousMode !== mode;
		const standardGameChanged = previousStandardGame !== standardGame;
		const pvpGameChanged = previousPvPGame !== pvpGame;
		const pvpActionChanged = previousPvPAction !== pvpAction;

		if (modeChanged || (mode === 'standard' && standardGameChanged)) {
			setStandardForms(DEFAULT_STANDARD_FORMS);
			setStatus(null);
			setError(null);
		}

		if (
			modeChanged ||
			(mode === 'pvp' && (pvpGameChanged || pvpActionChanged))
		) {
			setPvpForms(DEFAULT_PVP_FORMS);
			setStatus(null);
			setError(null);
		}

		previousModeRef.current = mode;
		previousStandardGameRef.current = standardGame;
		previousPvPGameRef.current = pvpGame;
		previousPvPActionRef.current = pvpAction;
	}, [mode, pvpAction, pvpGame, setPvpForms, setStandardForms, standardGame]);

	React.useEffect(() => {
		if (mode !== 'pvp') {
			return;
		}

		let cancelled = false;

		const fetchPvPLobbies = async () => {
			setIsPvPLobbyLoading(true);
			setPvPLobbyError(null);

			try {
				const games = await currentClient.suigar.getPvPCoinflipGames({
					limit: 50,
				});

				if (!cancelled) {
					setPvPLobbyGames(games);
				}
			} catch (lobbyError) {
				if (!cancelled) {
					setPvPLobbyGames([]);
					setPvPLobbyError(parseError(lobbyError));
				}
			} finally {
				if (!cancelled) {
					setIsPvPLobbyLoading(false);
				}
			}
		};

		void fetchPvPLobbies();

		return () => {
			cancelled = true;
		};
	}, [currentClient, mode, pvpLobbyRefreshKey]);

	const normalizedCurrentAccount =
		currentAccount?.address.toLowerCase() ?? null;
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
		!pvpForms[pvpAction].gameId.trim();

	let currentCode = '';
	try {
		currentCode =
			mode === 'standard'
				? buildStandardTransaction(
						currentClient,
						standardGame,
						standardForms[standardGame],
						previewPlayerAddress,
						effectiveSelectedCoin,
						coinType,
					).code
				: isMissingPvPGameSelection
					? buildPvPPreviewFallback(pvpAction, {
							playerAddress: previewPlayerAddress,
							coinType,
						})
					: buildPvPTransaction(
							currentClient,
							pvpAction,
							pvpForms[pvpAction],
							previewPlayerAddress,
							effectiveSelectedCoin,
							coinType,
						).code;
	} catch (buildError) {
		currentCode = `// Unable to build sample code yet\n// ${parseError(buildError)}`;
	}

	function updateQuery(key: string, value: string) {
		if (typeof window === 'undefined') {
			return;
		}

		const currentUrl = new URL(window.location.href);
		const params = new URLSearchParams(currentUrl.search);
		params.set(key, value);
		const nextSearch = params.toString();
		const nextUrl = `${currentUrl.pathname}${nextSearch ? `?${nextSearch}` : ''}${currentUrl.hash}`;
		window.history.replaceState(window.history.state, '', nextUrl);
	}

	function updateStandardForm<K extends StandardGameId>(
		game: K,
		patch: Partial<StandardForms[K]>,
	) {
		setStandardForms((current) => ({
			...current,
			[game]: { ...current[game], ...patch },
		}));
	}

	function updatePvPForm<K extends PvPAction>(
		action: K,
		patch: Partial<PvPCoinflipForms[K]>,
	) {
		setPvpForms((current) => ({
			...current,
			[action]: { ...current[action], ...patch },
		}));
	}

	function handleSelectPvPLobby(
		action: 'join' | 'cancel',
		game: PvPCoinflipLobbyGame,
	) {
		updatePvPForm(action, { gameId: game.id });
		const matchingCoinKey = resolveCoinKeyForType(game.coinType, coinTypes);
		if (matchingCoinKey) {
			setSelectedCoin(matchingCoinKey);
		}
		setError(null);
		setStatus(null);
	}

	async function handleExecute() {
		if (!currentAccount) {
			setError('Connect a wallet before executing a transaction.');
			return;
		}

		setError(null);
		setStatus(null);
		setIsExecuting(true);

		try {
			if (mode === 'pvp' && isMissingPvPGameSelection) {
				throw new Error(
					`Select a PvP lobby card before trying to ${pvpAction} a game.`,
				);
			}

			const playerAddress = currentAccount.address;
			const buildResult =
				mode === 'standard'
					? buildStandardTransaction(
							currentClient,
							standardGame,
							standardForms[standardGame],
							playerAddress,
							effectiveSelectedCoin,
							coinType,
						)
					: buildPvPTransaction(
							currentClient,
							pvpAction,
							pvpForms[pvpAction],
							playerAddress,
							effectiveSelectedCoin,
							coinType,
						);

			const execution = await dAppKit.signAndExecuteTransaction({
				transaction: buildResult.transaction,
			});

			if (execution.$kind === 'FailedTransaction') {
				throw new Error(execution.FailedTransaction.status.error?.message);
			}

			const digest = execution.Transaction.digest;
			setStatus(digest);

			const finalResult = await currentClient.waitForTransaction({
				digest,
				include: {
					effects: true,
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

			setBalanceRefreshKey((current) => current + 1);
			setPvPLobbyRefreshKey((current) => current + 1);
		} catch (executionError) {
			setError(parseError(executionError));
		} finally {
			setIsExecuting(false);
		}
	}

	return (
		<div className="min-h-screen">
			<div className="fixed inset-x-0 top-0 z-40 px-3 pt-3 md:px-5 md:pt-4 lg:px-8">
				<div className="mx-auto max-w-[1500px]">
					<nav className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/65 bg-card/58 px-3 py-2 shadow-[0_18px_45px_-36px_rgba(8,47,91,0.5)] backdrop-blur-2xl supports-backdrop-filter:bg-card/45 dark:border-border/75 dark:bg-card/42 dark:shadow-[0_18px_45px_-36px_rgba(0,0,0,0.72)] sm:px-4 md:rounded-3xl md:py-2.5">
						<div className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full px-1 py-1">
							<Link
								href="/standard?game=coinflip"
								scroll={false}
								className="inline-flex min-w-0 items-center gap-2"
							>
								<Image
									src={withBasePath('/logo/icon.svg')}
									alt="Suigar"
									width={36}
									height={36}
									className="h-8 w-8 md:hidden"
									priority
								/>
								<Image
									src={withBasePath('/logo/suigar-logo-full.svg')}
									alt="Suigar"
									width={132}
									height={36}
									className="hidden h-8 w-auto md:block md:h-10"
									priority
								/>
							</Link>
						</div>

						<div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto">
							<ThemeToggle className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
							{currentAccount ? (
								<div className="shrink-0">
									<Select
										value={selectedCoin}
										onValueChange={(value) =>
											setSelectedCoin(value as SupportedCoinKey)
										}
									>
										<SelectTrigger className="w-auto min-w-0 rounded-full border-border/70 bg-background/55">
											<CoinSelectLabel
												coinKey={effectiveSelectedCoin}
												amount={getCoinDisplayAmount({
													currentAccount,
													balanceOwner,
													balanceState: coinBalances[effectiveSelectedCoin],
												})}
											/>
										</SelectTrigger>
										<SelectContent>
											{coinOptions.map(([key]) => {
												return (
													<SelectItem key={key} value={key}>
														<CoinSelectLabel
															coinKey={key}
															amount={getCoinDisplayAmount({
																currentAccount,
																balanceOwner,
																balanceState: coinBalances[key],
															})}
														/>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</div>
							) : null}
							<div className="shrink-0">
								<ConnectButton />
							</div>
						</div>
					</nav>
				</div>
			</div>

			<div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-3 pb-6 pt-20 md:px-5 md:pt-24 lg:px-8">
				<main className="mt-2 flex flex-1 flex-col gap-6">
					<section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/80 px-4 py-4 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)] md:rounded-4xl md:px-5 md:py-5">
						<div className="relative flex flex-col gap-4">
							<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-6">
								<div className="space-y-2">
									<h1 className="text-2xl leading-none text-foreground md:text-4xl xl:text-5xl">
										Game integration playground
									</h1>
									<p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
										Build standard and PvP transactions, inspect the exact
										builder call, execute it, and keep a shared decoded event
										log.
									</p>
								</div>

								<div className="flex flex-col gap-3 lg:min-w-[360px] lg:items-end">
									<div className="flex flex-wrap items-center gap-2 lg:justify-end">
										<Button
											asChild
											variant={mode === 'standard' ? 'default' : 'outline'}
											size="sm"
											className="rounded-full px-4"
										>
											<Link href="/standard?game=coinflip" scroll={false}>
												Standard
											</Link>
										</Button>
										<Button
											asChild
											variant={mode === 'pvp' ? 'default' : 'outline'}
											size="sm"
											className="rounded-full px-4"
										>
											<Link
												href="/pvp?game=pvp-coinflip&action=create"
												scroll={false}
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
													onValueChange={(value) => {
														setStandardGame(value as StandardGameId);
														updateQuery('game', value);
													}}
												>
													<SelectTrigger className="h-10 rounded-full border-border/70 bg-background/55 px-4">
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
													<Select
														value={pvpGame}
														onValueChange={(value) => {
															setPvPGame(value as PvPGameId);
															updateQuery('game', value);
														}}
													>
														<SelectTrigger className="h-10 rounded-full border-border/70 bg-background/55 px-4">
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
																	? 'default'
																	: 'outline'
															}
															onClick={() => {
																setPvPAction(action.value);
																updateQuery('game', pvpGame);
																updateQuery('action', action.value);
															}}
															className={cn(
																'justify-start rounded-full',
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

					<div className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
						<SectionShell
							title={
								mode === 'standard' ? 'Game controls' : 'PvP Coinflip controls'
							}
							icon={
								mode === 'standard' ? (
									<Gamepad2 className="size-5 text-secondary dark:text-primary" />
								) : (
									<Swords className="size-5 text-secondary dark:text-primary" />
								)
							}
							description={
								mode === 'standard'
									? 'Adjust the active game inputs on the left while the transaction builder stays in sync on the right.'
									: 'Create, join, or cancel PvP Coinflip games while keeping the exact transaction builder visible.'
							}
						>
							<div className="space-y-6">
								{mode === 'standard' ? (
									<>
										{standardGame === 'coinflip' ? (
											<CoinflipForm
												value={standardForms.coinflip}
												onChange={(patch) =>
													updateStandardForm('coinflip', patch)
												}
											/>
										) : null}
										{standardGame === 'limbo' ? (
											<LimboForm
												value={standardForms.limbo}
												onChange={(patch) => updateStandardForm('limbo', patch)}
											/>
										) : null}
										{standardGame === 'plinko' ? (
											<PlinkoForm
												value={standardForms.plinko}
												onChange={(patch) =>
													updateStandardForm('plinko', patch)
												}
											/>
										) : null}
										{standardGame === 'range' ? (
											<RangeForm
												value={standardForms.range}
												onChange={(patch) => updateStandardForm('range', patch)}
											/>
										) : null}
										{standardGame === 'wheel' ? (
											<WheelForm
												value={standardForms.wheel}
												onChange={(patch) => updateStandardForm('wheel', patch)}
											/>
										) : null}
									</>
								) : (
									<>
										{pvpAction === 'create' ? (
											<PvPCoinflipCreateForm
												value={pvpForms.create}
												onChange={(patch) => updatePvPForm('create', patch)}
											/>
										) : null}
										{pvpAction === 'join' ? (
											<>
												<div className="rounded-2xl border border-border/70 bg-background/45 p-4">
													<FieldGroup className="items-center justify-between gap-3">
														<div className="space-y-1">
															<FieldLabel htmlFor="join-private-lobbies">
																Show private lobbies
															</FieldLabel>
															<FieldDescription>
																Public unresolved lobbies stay visible even when
																the wallet is disconnected.
															</FieldDescription>
														</div>
														<Switch
															id="join-private-lobbies"
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
															? COIN_DECIMALS[matchingCoinKey]
															: 9;
													}}
													onRefresh={() =>
														setPvPLobbyRefreshKey((current) => current + 1)
													}
													onSelectGame={(game) =>
														handleSelectPvPLobby('join', game)
													}
												/>
												<PvPCoinflipJoinForm value={pvpForms.join} />
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
															? COIN_DECIMALS[matchingCoinKey]
															: 9;
													}}
													onRefresh={() =>
														setPvPLobbyRefreshKey((current) => current + 1)
													}
													onSelectGame={(game) =>
														handleSelectPvPLobby('cancel', game)
													}
												/>
												<PvPCoinflipCancelForm value={pvpForms.cancel} />
											</>
										) : null}
									</>
								)}

								<div className="rounded-2xl border border-border/70 bg-background/45 p-4">
									<p className="text-sm text-muted-foreground">
										The event table below is shared across game switches, so
										each new bet or PvP action appends to the same running
										history.
									</p>
								</div>
							</div>
						</SectionShell>

						<div className="flex flex-col gap-6">
							<CodeSample code={currentCode} />

							<ExecuteTransactionCard
								onExecute={handleExecute}
								isExecuting={isExecuting}
								status={visibleStatus}
								error={error}
							/>
						</div>
					</div>

					<EventsTable />
				</main>
			</div>

			<div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
				<Button
					asChild
					className="h-12 rounded-full px-4 shadow-lg md:h-14 md:px-5"
				>
					<a
						href="https://docs.suigar.com/sdk"
						target="_blank"
						rel="noreferrer"
						aria-label="Open SDK documentation"
						title="SDK Docs"
					>
						<BookOpenText className="size-5 md:size-6" />
						SDK Docs
					</a>
				</Button>
			</div>
		</div>
	);
}

export function StandardIntegrationPage() {
	return <IntegrationContent mode="standard" />;
}

export function PvPIntegrationPage() {
	return <IntegrationContent mode="pvp" />;
}
