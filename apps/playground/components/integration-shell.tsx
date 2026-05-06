'use client';

import {
	useCurrentAccount,
	useCurrentClient,
	useDAppKit,
} from '@mysten/dapp-kit-react';
import { ConnectButton } from '@mysten/dapp-kit-react/ui';
import {
	BookOpenText,
	CirclePlus,
	Cog,
	Gamepad2,
	ShieldX,
	Swords,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import * as React from 'react';
import { DEFAULT_RANGE_SCALE } from '@suigar/sdk/utils';
import { CodeSample } from '@/components/code-sample';
import { CoinIcon } from '@/components/coins';
import { EventsTable } from '@/components/events-table';
import { ExecuteTransactionCard } from '@/components/execute-transaction';
import { GameSettingsDialog } from '@/components/game-settings-dialog';
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
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card';
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
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import { parseSuigarEvents } from '@/lib/event-parsing';
import {
	findGameConfigOption,
	resolveStakeRangeForGame,
	summarizePvPGameParameters,
	summarizeStandardGameParameters,
} from '@/lib/on-chain-parameters';
import { withBasePath } from '@/lib/paths';
import {
	COIN_DECIMALS,
	DEFAULT_PVP_FORMS,
	DEFAULT_STANDARD_FORMS,
	getRangePointMax,
	isPvPAction,
	isPvPGame,
	isStandardGame,
	parseOptionalNumber,
} from '@/lib/suigar-app';
import type {
	PvPAction,
	PvPCoinflipForms,
	PvPCoinflipLobbyGame,
	PvPGameId,
	PvPGameParametersSummary,
	StandardForms,
	StandardGameId,
	StandardGameParametersSummary,
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
		<div className="flex min-w-0 items-center whitespace-nowrap gap-1">
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

function clampNumber(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

function formatInputNumber(value: number) {
	if (!Number.isFinite(value)) {
		return '0';
	}

	const rounded = Math.round(value * 1_000_000) / 1_000_000;
	return Number.isInteger(rounded)
		? String(rounded)
		: rounded.toString().replace(/0+$/, '').replace(/\.$/, '');
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

function getStandardGameLabel(game: StandardGameId) {
	return (
		STANDARD_GAME_OPTIONS.find((option) => option.value === game)?.label ?? game
	);
}

function getPvPGameLabel(game: PvPGameId) {
	return (
		PVP_GAME_OPTIONS.find((option) => option.value === game)?.label ?? game
	);
}

function stringifyGameParameters(value: unknown) {
	return JSON.stringify(
		value,
		(_, currentValue) =>
			typeof currentValue === 'bigint' ? currentValue.toString() : currentValue,
		2,
	);
}

function SectionShell({
	title,
	description,
	icon,
	action,
	children,
}: {
	title: string;
	description: string;
	icon: React.ReactNode;
	action?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<Card className="h-full shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)]">
			<CardHeader className="flex-row items-start justify-between gap-4">
				<div className="min-w-0 flex-1 space-y-2">
					<CardTitle className="flex items-center gap-2">
						{icon}
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</div>
				{action ? <CardAction className="shrink-0">{action}</CardAction> : null}
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
	const [standardGameParameters, setStandardGameParameters] =
		React.useState<StandardGameParametersSummary | null>(null);
	const [standardGameParametersPayload, setStandardGameParametersPayload] =
		React.useState<unknown>(null);
	const [standardGameParametersError, setStandardGameParametersError] =
		React.useState<string | null>(null);
	const [isStandardGameParametersLoading, setIsStandardGameParametersLoading] =
		React.useState(false);
	const [pvpGameParameters, setPvPGameParameters] =
		React.useState<PvPGameParametersSummary | null>(null);
	const [pvpGameParametersPayload, setPvPGameParametersPayload] =
		React.useState<unknown>(null);
	const [pvpGameParametersError, setPvPGameParametersError] = React.useState<
		string | null
	>(null);
	const [isPvPGameParametersLoading, setIsPvPGameParametersLoading] =
		React.useState(false);
	const [isGameSettingsDialogOpen, setIsGameSettingsDialogOpen] =
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
		let cancelled = false;

		const fetchStandardGameParameters = async () => {
			setIsStandardGameParametersLoading(true);
			setStandardGameParameters(null);
			setStandardGameParametersPayload(null);
			setStandardGameParametersError(null);

			try {
				const parameters = await currentClient.suigar.getGameParameters(
					standardGame,
					{ coinType },
				);

				if (cancelled) {
					return;
				}

				setStandardGameParametersPayload(parameters);
				setStandardGameParameters(
					summarizeStandardGameParameters(
						standardGame,
						parameters,
						COIN_DECIMALS[effectiveSelectedCoin],
					),
				);
			} catch (parametersError) {
				if (cancelled) {
					return;
				}

				setStandardGameParameters(null);
				setStandardGameParametersPayload(null);
				setStandardGameParametersError(parseError(parametersError));
			} finally {
				if (!cancelled) {
					setIsStandardGameParametersLoading(false);
				}
			}
		};

		void fetchStandardGameParameters();

		return () => {
			cancelled = true;
		};
	}, [coinType, currentClient, effectiveSelectedCoin, standardGame]);

	React.useEffect(() => {
		if (mode !== 'pvp') {
			return;
		}

		let cancelled = false;

		const fetchPvPGameParameters = async () => {
			setIsPvPGameParametersLoading(true);
			setPvPGameParameters(null);
			setPvPGameParametersPayload(null);
			setPvPGameParametersError(null);

			try {
				const parameters = await currentClient.suigar.getGameParameters(
					pvpGame,
					{
						coinType,
					},
				);

				if (cancelled) {
					return;
				}

				setPvPGameParametersPayload(parameters);
				setPvPGameParameters(
					summarizePvPGameParameters(
						pvpGame,
						parameters,
						COIN_DECIMALS[effectiveSelectedCoin],
					),
				);
			} catch (parametersError) {
				if (cancelled) {
					return;
				}

				setPvPGameParameters(null);
				setPvPGameParametersPayload(null);
				setPvPGameParametersError(parseError(parametersError));
			} finally {
				if (!cancelled) {
					setIsPvPGameParametersLoading(false);
				}
			}
		};

		void fetchPvPGameParameters();

		return () => {
			cancelled = true;
		};
	}, [coinType, currentClient, effectiveSelectedCoin, mode, pvpGame]);

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
	const activeConfigId =
		standardGame === 'plinko' || standardGame === 'wheel'
			? standardForms[standardGame].configId
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
	const stakeDescription = React.useMemo(() => {
		if (isStandardGameParametersLoading) {
			return (
				<FieldDescription
					size="sm"
					className="inline-flex items-center gap-1.5"
				>
					<Spinner className="size-3.5" />
					Loading on-chain stake limits for this coin.
				</FieldDescription>
			);
		}

		if (standardGameParametersError) {
			return (
				<FieldDescription size="sm">
					Unable to load on-chain stake limits: {standardGameParametersError}
				</FieldDescription>
			);
		}

		if (!activeStakeRange) {
			return null;
		}

		return (
			<FieldDescription size="sm">
				<span className="inline-flex flex-nowrap items-center overflow-x-auto align-middle gap-2">
					<span className="shrink-0">On-chain stake range:</span>
					<FieldCode className="shrink-0">{activeStakeRange.min}</FieldCode>
					<span className="shrink-0">to</span>
					<FieldCode className="shrink-0">{activeStakeRange.max}</FieldCode>
					<span className="inline-flex shrink-0 items-center whitespace-nowrap uppercase tracking-[0.12em] gap-1">
						<CoinIcon coinKey={effectiveSelectedCoin} className="size-4" />
						{effectiveSelectedCoin.toUpperCase()}
					</span>
				</span>
				{activeConfigOption && !activeConfigOption.isPlayable
					? '. The selected config is disabled on-chain.'
					: '.'}
			</FieldDescription>
		);
	}, [
		activeConfigOption,
		activeStakeRange,
		effectiveSelectedCoin,
		isStandardGameParametersLoading,
		standardGameParametersError,
	]);
	const pvpStakeDescription = React.useMemo(() => {
		if (mode !== 'pvp' || pvpAction !== 'create') {
			return null;
		}

		if (isPvPGameParametersLoading) {
			return (
				<FieldDescription
					size="sm"
					className="inline-flex items-center gap-1.5"
				>
					<Spinner className="size-3.5" />
					Loading on-chain stake minimum for this coin.
				</FieldDescription>
			);
		}

		if (pvpGameParametersError) {
			return (
				<FieldDescription size="sm">
					Unable to load on-chain stake minimum: {pvpGameParametersError}
				</FieldDescription>
			);
		}

		if (!pvpGameParameters?.stakeRange) {
			return null;
		}

		return (
			<FieldDescription size="sm">
				<span className="inline-flex flex-nowrap items-center overflow-x-auto align-middle gap-2">
					<span className="shrink-0">On-chain stake minimum:</span>
					<FieldCode className="shrink-0">
						{pvpGameParameters.stakeRange.min}
					</FieldCode>
					<span className="inline-flex shrink-0 items-center whitespace-nowrap uppercase tracking-[0.12em] gap-1">
						<CoinIcon coinKey={effectiveSelectedCoin} className="size-4" />
						{effectiveSelectedCoin.toUpperCase()}
					</span>
				</span>
				.
			</FieldDescription>
		);
	}, [
		effectiveSelectedCoin,
		isPvPGameParametersLoading,
		mode,
		pvpAction,
		pvpGameParameters,
		pvpGameParametersError,
	]);
	const standardGameLabel = React.useMemo(
		() => getStandardGameLabel(standardGame),
		[standardGame],
	);
	const pvpGameLabel = React.useMemo(() => getPvPGameLabel(pvpGame), [pvpGame]);
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
	const settingsCallPreview = React.useMemo(
		() =>
			mode === 'standard'
				? `client.suigar.getGameParameters('${standardGame}', { coinType: '${coinType}' })`
				: `client.suigar.getGameParameters('${pvpGame}', { coinType: '${coinType}' })`,
		[coinType, mode, pvpGame, standardGame],
	);
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
				.
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
				.
			</FieldDescription>
		);
	}, [standardGame, standardGameParameters, standardForms.range.scale]);

	React.useEffect(() => {
		if (standardGame !== 'plinko' && standardGame !== 'wheel') {
			return;
		}

		const configOptions = standardGameParameters?.configOptions;
		if (!configOptions?.length) {
			return;
		}

		const currentConfigId = standardForms[standardGame].configId;
		const nextConfig =
			configOptions.find(
				(option) => option.id === currentConfigId && option.isPlayable,
			) ??
			configOptions.find((option) => option.isPlayable) ??
			configOptions[0];

		if (!nextConfig || nextConfig.id === currentConfigId) {
			return;
		}

		setStandardForms((current) => ({
			...current,
			[standardGame]: {
				...current[standardGame],
				configId: nextConfig.id,
			},
		}));
	}, [setStandardForms, standardForms, standardGame, standardGameParameters]);

	React.useEffect(() => {
		const currentForm = standardForms[standardGame];
		const patch: Record<string, string | boolean> = {};

		if (activeStakeRange) {
			const currentStake = parseOptionalNumber(currentForm.stake);
			const minStake = parseOptionalNumber(activeStakeRange.min);
			const maxStake = parseOptionalNumber(activeStakeRange.max);

			if (
				currentStake !== undefined &&
				minStake !== undefined &&
				maxStake !== undefined
			) {
				if (currentStake < minStake) {
					patch.stake = activeStakeRange.min;
				} else if (currentStake > maxStake) {
					patch.stake = activeStakeRange.max;
				}
			}
		}

		if (
			standardGame === 'limbo' &&
			standardGameParameters?.targetMultiplierRange
		) {
			const targetMultiplier = parseOptionalNumber(
				standardForms.limbo.targetMultiplier,
			);

			if (targetMultiplier !== undefined) {
				const clampedTargetMultiplier = clampNumber(
					targetMultiplier,
					standardGameParameters.targetMultiplierRange.min,
					standardGameParameters.targetMultiplierRange.max,
				);

				if (clampedTargetMultiplier !== targetMultiplier) {
					patch.targetMultiplier = formatInputNumber(clampedTargetMultiplier);
				}
			}
		}

		if (standardGame === 'range' && standardGameParameters?.rangeBounds) {
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

				if (nextLeftPoint !== leftPoint) {
					patch.leftPoint = formatInputNumber(nextLeftPoint);
				}

				if (nextRightPoint !== rightPoint) {
					patch.rightPoint = formatInputNumber(nextRightPoint);
				}
			}
		}

		if (Object.keys(patch).length === 0) {
			return;
		}

		setStandardForms((current) => ({
			...current,
			[standardGame]: {
				...current[standardGame],
				...patch,
			},
		}));
	}, [
		activeStakeRange,
		setStandardForms,
		standardForms,
		standardGame,
		standardGameParameters,
	]);

	React.useEffect(() => {
		if (
			mode !== 'pvp' ||
			pvpAction !== 'create' ||
			!pvpGameParameters?.stakeRange
		) {
			return;
		}

		const currentStake = parseOptionalNumber(pvpForms.create.stake);
		const minStake = parseOptionalNumber(pvpGameParameters.stakeRange.min);

		if (
			currentStake === undefined ||
			minStake === undefined ||
			currentStake >= minStake
		) {
			return;
		}

		setPvpForms((current) => ({
			...current,
			create: {
				...current.create,
				stake: pvpGameParameters.stakeRange.min,
			},
		}));
	}, [mode, pvpAction, pvpForms.create.stake, pvpGameParameters, setPvpForms]);

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
				<div className="max-w-[1500px] mx-auto">
					<nav className="flex items-center justify-between gap-3 px-3 py-2 sm:px-4 md:py-2.5 border-border/65 bg-card/58 shadow-[0_18px_45px_-36px_rgba(8,47,91,0.5)] supports-backdrop-filter:bg-card/45 dark:border-border/75 dark:bg-card/42 dark:shadow-[0_18px_45px_-36px_rgba(0,0,0,0.72)] rounded-[1.25rem] border backdrop-blur-2xl md:rounded-3xl">
						<div className="inline-flex min-w-0 shrink-0 items-center gap-2 px-1 py-1 rounded-full">
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
									className="size-8 md:hidden"
									priority
								/>
								<Image
									src={withBasePath('/logo/suigar-logo-full.svg')}
									alt="Suigar"
									width={132}
									height={36}
									className="hidden w-auto md:block md:h-10"
									priority
								/>
							</Link>
						</div>

						<div className="flex min-w-0 flex-1 items-center justify-end overflow-x-auto gap-2">
							<ThemeToggle className="h-8 w-8 shrink-0 md:h-9 md:w-9" />
							{currentAccount ? (
								<div className="shrink-0">
									<Select
										value={selectedCoin}
										onValueChange={(value) =>
											setSelectedCoin(value as SupportedCoinKey)
										}
									>
										<SelectTrigger className="h-10 w-auto min-w-[8.75rem] px-3 border-border/70 bg-background/55 rounded-full">
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

			<div className="flex min-h-screen w-full max-w-[1500px] flex-col mx-auto px-3 pb-6 pt-20 md:px-5 md:pt-24 lg:px-8">
				<main className="flex flex-1 flex-col mt-2 gap-6">
					<section className="relative overflow-hidden px-4 py-4 md:px-5 md:py-5 border-border/70 bg-card/80 shadow-[0_28px_80px_-48px_rgba(8,47,91,0.42)] dark:shadow-[0_28px_80px_-48px_rgba(0,0,0,0.6)] rounded-3xl border backdrop-blur-xl md:rounded-4xl">
						<div className="relative flex flex-col gap-4">
							<div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 lg:gap-6">
								<div className="space-y-2">
									<h1 className="text-2xl leading-none md:text-4xl xl:text-5xl text-foreground">
										Suigar SDK playground
									</h1>
									<p className="max-w-2xl text-sm leading-6 md:text-base text-muted-foreground">
										Build standard and PvP transactions, inspect the exact
										builder call, execute it, and keep a shared decoded event
										log.
									</p>
								</div>

								<div className="flex flex-col lg:min-w-[360px] lg:items-end gap-3">
									<div className="flex flex-wrap items-center lg:justify-end gap-2">
										<Button
											asChild
											variant={
												mode === 'standard' ? 'control-active' : 'control'
											}
											size="sm"
											className="h-10 px-4 rounded-full"
										>
											<Link href="/standard?game=coinflip" scroll={false}>
												Standard
											</Link>
										</Button>
										<Button
											asChild
											variant={mode === 'pvp' ? 'control-active' : 'control'}
											size="sm"
											className="h-10 px-4 rounded-full"
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
													<SelectTrigger className="h-11 px-4 border-border/70 bg-background/55 rounded-full">
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
														<SelectTrigger className="h-11 px-4 border-border/70 bg-background/55 rounded-full">
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
															onClick={() => {
																setPvPAction(action.value);
																updateQuery('game', pvpGame);
																updateQuery('action', action.value);
															}}
															className={cn(
																'h-10 justify-start px-4 rounded-full',
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

							<div className="text-sm px-4 py-3 border-border/70 bg-background/35 text-muted-foreground rounded-2xl border">
								Stake inputs use human values like{' '}
								<span className="font-medium text-foreground">1</span> or{' '}
								<span className="font-medium text-foreground">2.5</span> and are
								converted to atomic units in the generated transaction.
							</div>
						</div>
					</section>

					<div className="grid lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-6">
						<SectionShell
							title={
								mode === 'standard'
									? `${getStandardGameLabel(standardGame)} controls`
									: 'PvP Coinflip controls'
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
							action={
								<Button
									type="button"
									variant="ghost"
									size="sm"
									onClick={() => setIsGameSettingsDialogOpen(true)}
									className="h-10 px-4 border-border/70 bg-background/45 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full border"
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
												value={standardForms.coinflip}
												onChange={(patch) =>
													updateStandardForm('coinflip', patch)
												}
												stakeDescription={stakeDescription}
											/>
										) : null}
										{standardGame === 'limbo' ? (
											<LimboForm
												value={standardForms.limbo}
												onChange={(patch) => updateStandardForm('limbo', patch)}
												stakeDescription={stakeDescription}
												targetMultiplierDescription={
													limboTargetMultiplierDescription
												}
											/>
										) : null}
										{standardGame === 'plinko' ? (
											<PlinkoForm
												value={standardForms.plinko}
												onChange={(patch) =>
													updateStandardForm('plinko', patch)
												}
												configOptions={standardGameParameters?.configOptions}
												isConfigLoading={isStandardGameParametersLoading}
												configError={standardGameParametersError}
												stakeDescription={stakeDescription}
											/>
										) : null}
										{standardGame === 'range' ? (
											<RangeForm
												value={standardForms.range}
												onChange={(patch) => updateStandardForm('range', patch)}
												stakeDescription={stakeDescription}
												rangeBoundsDescription={rangeBoundsDescription}
											/>
										) : null}
										{standardGame === 'wheel' ? (
											<WheelForm
												value={standardForms.wheel}
												onChange={(patch) => updateStandardForm('wheel', patch)}
												configOptions={standardGameParameters?.configOptions}
												isConfigLoading={isStandardGameParametersLoading}
												configError={standardGameParametersError}
												stakeDescription={stakeDescription}
											/>
										) : null}
									</>
								) : (
									<>
										{pvpAction === 'create' ? (
											<PvPCoinflipCreateForm
												value={pvpForms.create}
												onChange={(patch) => updatePvPForm('create', patch)}
												stakeDescription={pvpStakeDescription}
											/>
										) : null}
										{pvpAction === 'join' ? (
											<>
												<div className="p-4 border-border/70 bg-background/45 rounded-2xl border">
													<FieldGroup className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
														<div className="min-w-0 space-y-1">
															<FieldLabel htmlFor="join-private-lobbies">
																Show private lobbies
															</FieldLabel>
															<FieldDescription size="sm">
																Public unresolved lobbies stay visible even when
																the wallet is disconnected.
															</FieldDescription>
														</div>
														<Switch
															id="join-private-lobbies"
															size="default"
															className="justify-self-end self-start mt-0.5"
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

			<GameSettingsDialog
				activeConfigOption={activeConfigOption}
				activeStakeRange={settingsSummary?.stakeRange ?? activeStakeRange}
				coinKey={effectiveSelectedCoin}
				coinLabel={effectiveSelectedCoin.toUpperCase()}
				configOptions={settingsConfigOptions}
				error={settingsError}
				gameLabel={settingsGameLabel}
				isLoading={isSettingsLoading}
				isOpen={isGameSettingsDialogOpen}
				onClose={() => setIsGameSettingsDialogOpen(false)}
				serializedGameSettings={serializedGameSettings}
				settingsCallPreview={settingsCallPreview}
				topLevelDetails={settingsSummary?.topLevelDetails}
			/>

			<div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
				<Button
					asChild
					className="h-12 md:h-14 px-4 md:px-5 shadow-lg rounded-full"
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
