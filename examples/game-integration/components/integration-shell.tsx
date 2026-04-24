'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
	CheckCircle2,
	Gamepad2,
	LoaderCircle,
	SendHorizontal,
	Swords,
} from 'lucide-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import {
	useCurrentAccount,
	useCurrentClient,
	useDAppKit,
} from '@mysten/dapp-kit-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CodeSample } from '@/components/code-sample';
import { EventsTable } from '@/components/events-table';
import { CoinflipForm } from '@/components/games/coinflip-form';
import { LimboForm } from '@/components/games/limbo-form';
import { PlinkoForm } from '@/components/games/plinko-form';
import { PvPCancelForm } from '@/components/games/pvp-cancel-form';
import { PvPCreateForm } from '@/components/games/pvp-create-form';
import { PvPJoinForm } from '@/components/games/pvp-join-form';
import { RangeForm } from '@/components/games/range-form';
import { WheelForm } from '@/components/games/wheel-form';
import { useEventLog } from '@/components/providers/event-log-provider';
import { ThemeToggle } from '@/components/theme-toggle';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { parseSuigarEvents } from '@/lib/event-parsing';
import {
	DEFAULT_PVP_FORMS,
	DEFAULT_STANDARD_FORMS,
	isPvPAction,
	isStandardGame,
} from '@/lib/suigar-app';
import type {
	PvPAction,
	PvPForms,
	StandardForms,
	StandardGameId,
	SupportedCoinKey,
} from '@/lib/suigar-types';
import {
	buildPvPTransaction,
	buildStandardTransaction,
} from '@/lib/transaction-builders';
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
	{ value: 'create', label: 'Create' },
	{ value: 'join', label: 'Join' },
	{ value: 'cancel', label: 'Cancel' },
] as const satisfies ReadonlyArray<{ value: PvPAction; label: string }>;

const PREVIEW_OWNER = `0x${'0'.repeat(64)}`;

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
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const dAppKit = useDAppKit();
	const currentClient = useCurrentClient();
	const currentAccount = useCurrentAccount();
	const { addRows } = useEventLog();
	const suigarClient = currentClient as typeof currentClient & {
		suigar: {
			getConfig: () => {
				coinTypes: Record<SupportedCoinKey, string>;
			};
			tx: unknown;
			bcs: unknown;
		};
	};

	const [standardForms, setStandardForms] = usePersistentForms<StandardForms>(
		'suigar-example-standard-forms-v2',
		DEFAULT_STANDARD_FORMS,
	);
	const [pvpForms, setPvpForms] = usePersistentForms<PvPForms>(
		'suigar-example-pvp-forms-v2',
		DEFAULT_PVP_FORMS,
	);
	const [selectedCoin, setSelectedCoin] =
		React.useState<SupportedCoinKey>('sui');
	const [status, setStatus] = React.useState<string | null>(null);
	const [error, setError] = React.useState<string | null>(null);
	const [isExecuting, setIsExecuting] = React.useState(false);

	const standardGame = React.useMemo<StandardGameId>(() => {
		const queryGame = searchParams.get('game');
		return isStandardGame(queryGame) ? queryGame : 'coinflip';
	}, [searchParams]);

	const pvpAction = React.useMemo<PvPAction>(() => {
		const queryAction = searchParams.get('action');
		return isPvPAction(queryAction) ? queryAction : 'create';
	}, [searchParams]);

	const coinTypes = suigarClient.suigar.getConfig().coinTypes;
	const coinOptions = Object.entries(coinTypes) as Array<
		[SupportedCoinKey, string]
	>;
	const effectiveSelectedCoin = coinTypes[selectedCoin]
		? selectedCoin
		: (coinOptions[0]?.[0] ?? 'sui');
	const coinType = coinTypes[effectiveSelectedCoin];
	const previewOwner = currentAccount?.address ?? PREVIEW_OWNER;
	const visibleStatus = currentAccount ? status : null;

	let currentCode = '';
	try {
		currentCode =
			mode === 'standard'
				? buildStandardTransaction(
						suigarClient,
						standardGame,
						standardForms[standardGame],
						previewOwner,
						effectiveSelectedCoin,
						coinType,
					).code
				: buildPvPTransaction(
						suigarClient,
						pvpAction,
						pvpForms[pvpAction],
						previewOwner,
						effectiveSelectedCoin,
						coinType,
					).code;
	} catch (buildError) {
		currentCode = `// Unable to build sample code yet\n// ${parseError(buildError)}`;
	}

	function updateQuery(key: string, value: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set(key, value);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
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
		patch: Partial<PvPForms[K]>,
	) {
		setPvpForms((current) => ({
			...current,
			[action]: { ...current[action], ...patch },
		}));
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
			const owner = currentAccount.address;
			const buildResult =
				mode === 'standard'
					? buildStandardTransaction(
							suigarClient,
							standardGame,
							standardForms[standardGame],
							owner,
							effectiveSelectedCoin,
							coinType,
						)
					: buildPvPTransaction(
							suigarClient,
							pvpAction,
							pvpForms[pvpAction],
							owner,
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
				suigarClient,
				digest,
				finalResult.Transaction.events,
			);
			if (rows.length > 0) {
				addRows(rows);
			}
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
					<nav className="flex items-center justify-between gap-3 rounded-[1.25rem] border border-border/65 bg-card/58 px-3 py-2 shadow-[0_18px_45px_-36px_rgba(8,47,91,0.5)] backdrop-blur-2xl supports-backdrop-filter:bg-card/45 dark:border-border/75 dark:bg-card/42 dark:shadow-[0_18px_45px_-36px_rgba(0,0,0,0.72)] sm:px-4 md:rounded-[1.5rem] md:py-2.5">
						<div className="inline-flex min-w-0 shrink-0 items-center gap-2 rounded-full px-1 py-1">
							<Link
								href="/standard?game=coinflip"
								scroll={false}
								className="inline-flex min-w-0 items-center gap-2"
							>
								<Image
									src="/logo/suigar-logo-full.svg"
									alt="Suigar"
									width={132}
									height={36}
									className="h-8 w-auto md:h-10"
									priority
								/>
							</Link>
						</div>

						<div className="flex min-w-0 flex-1 items-center justify-end gap-2 overflow-x-auto">
							<span className="hidden shrink-0 rounded-full border border-border/70 bg-background/55 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground sm:inline-flex">
								testnet
							</span>
							<div className="w-[9.5rem] shrink-0 md:w-[10rem]">
								<Select
									value={selectedCoin}
									onValueChange={(value) =>
										setSelectedCoin(value as SupportedCoinKey)
									}
								>
									<SelectTrigger className="h-8 rounded-full border-border/70 bg-background/55 px-3 text-xs md:h-9 md:px-3.5 md:text-sm">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{coinOptions.map(([key, value]) => (
											<SelectItem key={key} value={key}>
												{key.toUpperCase()} · {value.split('::').at(-1)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="wallet-compact shrink-0">
								<ConnectButton />
							</div>
							<ThemeToggle className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
						</div>
					</nav>
				</div>
			</div>

			<div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-3 pb-6 pt-20 md:px-5 md:pt-24 lg:px-8">
				<main className="mt-2 flex flex-1 flex-col gap-6">
					<section className="relative overflow-hidden rounded-[1.5rem] border border-border/70 bg-card/80 px-4 py-4 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] backdrop-blur-xl dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)] md:rounded-[2rem] md:px-5 md:py-5">
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
													onValueChange={(value) => updateQuery('game', value)}
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
											<div className="flex flex-wrap gap-2">
												{PVP_ACTION_OPTIONS.map((action) => (
													<Button
														key={action.value}
														type="button"
														size="sm"
														variant={
															pvpAction === action.value ? 'default' : 'outline'
														}
														onClick={() => {
															updateQuery('game', 'pvp-coinflip');
															updateQuery('action', action.value);
														}}
														className={cn(
															'justify-start rounded-full',
															pvpAction === action.value && 'shadow-none',
														)}
													>
														<Swords className="size-4" />
														{action.label}
													</Button>
												))}
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
							title={mode === 'standard' ? 'Game controls' : 'PvP controls'}
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
									: 'Create, join, or cancel PvP coinflip games while keeping the exact transaction builder visible.'
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
											<PvPCreateForm
												value={pvpForms.create}
												onChange={(patch) => updatePvPForm('create', patch)}
											/>
										) : null}
										{pvpAction === 'join' ? (
											<PvPJoinForm
												value={pvpForms.join}
												onChange={(patch) => updatePvPForm('join', patch)}
											/>
										) : null}
										{pvpAction === 'cancel' ? (
											<PvPCancelForm
												value={pvpForms.cancel}
												onChange={(patch) => updatePvPForm('cancel', patch)}
											/>
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

							<Card>
								<CardHeader>
									<CardTitle className="flex items-center gap-2">
										<SendHorizontal className="size-5 text-secondary dark:text-primary" />
										Execute transaction
									</CardTitle>
									<CardDescription>
										The connected wallet signs and submits the same transaction
										shown in the code block.
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex flex-col items-center gap-4">
										<Button
											size="lg"
											onClick={handleExecute}
											disabled={isExecuting || !currentAccount}
										>
											{isExecuting ? (
												<LoaderCircle className="size-4 animate-spin" />
											) : (
												<Swords className="size-4" />
											)}
											Sign and execute transaction
										</Button>
										{visibleStatus ? (
											<Alert variant="success" className="w-full">
												<CheckCircle2 />
												<AlertTitle>Executed</AlertTitle>
												<AlertDescription className="font-mono text-xs text-foreground break-all">
													{visibleStatus}
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
						</div>
					</div>

					<EventsTable />
				</main>
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
