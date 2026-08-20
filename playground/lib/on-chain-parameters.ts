'use client';

import type { SuigarClient } from '@suigar/sdk';
import { toBigInt } from '@suigar/sdk/utils';
import type {
	GameConfigOption,
	PvPGameId,
	PvPGameParametersSummary,
	StakeRangeSummary,
	StandardGameId,
	StandardGameParametersSummary,
} from '@/lib/suigar-types';

type StandardGameParametersResult = Awaited<ReturnType<SuigarClient['getGameParameters']>>;

type StakeParameters = {
	min_stake: bigint | string | number;
	max_stake: bigint | string | number;
};

type ConfigEntry = {
	key: number;
	value: {
		min_stake: bigint | string | number;
		max_stake: bigint | string | number;
		is_playable: boolean;
	};
};

function formatAtomicAmount(value: bigint, decimals: number) {
	const divisor = BigInt(10) ** BigInt(decimals);
	const whole = value / divisor;
	const fraction = value % divisor;

	if (fraction === BigInt(0)) {
		return whole.toString();
	}

	const trimmedFraction = fraction.toString().padStart(decimals, '0').replace(/0+$/, '');

	return `${whole.toString()}.${trimmedFraction}`;
}

function toStakeRange(minStake: bigint, maxStake: bigint, decimals: number): StakeRangeSummary {
	return {
		min: formatAtomicAmount(minStake, decimals),
		max: formatAtomicAmount(maxStake, decimals),
		kind: 'range',
	};
}

function toStakeMinimum(minStake: bigint, decimals: number): StakeRangeSummary {
	const formattedMinimum = formatAtomicAmount(minStake, decimals);

	return {
		min: formattedMinimum,
		max: formattedMinimum,
		kind: 'minimum',
	};
}

function toConfigOptions<TEntry extends ConfigEntry>(
	entries: Array<TEntry>,
	decimals: number,
	buildConfig: (entry: TEntry) => Pick<GameConfigOption, 'label' | 'details' | 'multiplierValues'>,
): Array<GameConfigOption> {
	return entries.map((entry) => {
		const stakeRange = toStakeRange(
			toBigInt(entry.value.min_stake),
			toBigInt(entry.value.max_stake),
			decimals,
		);
		const config = buildConfig(entry);

		return {
			id: String(entry.key),
			...config,
			isPlayable: entry.value.is_playable,
			stakeRange,
		};
	});
}

export function summarizeStandardGameParameters(
	game: StandardGameId,
	parameters: StandardGameParametersResult,
	decimals: number,
): StandardGameParametersSummary {
	switch (game) {
		case 'coinflip': {
			const stakeParameters = parameters as StakeParameters;
			const stakeRange = toStakeRange(
				toBigInt(stakeParameters.min_stake),
				toBigInt(stakeParameters.max_stake),
				decimals,
			);

			return { stakeRange };
		}
		case 'limbo': {
			const limboParameters = parameters as StakeParameters & {
				min_target_multiplier: number;
				max_target_multiplier: number;
				max_number_of_games: bigint | string | number;
			};
			const stakeRange = toStakeRange(
				toBigInt(limboParameters.min_stake),
				toBigInt(limboParameters.max_stake),
				decimals,
			);

			return {
				stakeRange,
				betCountLimit: {
					max: toBigInt(limboParameters.max_number_of_games),
					label: 'games',
				},
				targetMultiplierRange: {
					min: limboParameters.min_target_multiplier,
					max: limboParameters.max_target_multiplier,
				},
			};
		}
		case 'keno': {
			const kenoParameters = parameters as StakeParameters & {
				configs: {
					contents: Array<
						ConfigEntry & {
							value: ConfigEntry['value'] & {
								board_size: number;
								draw_count: number;
								min_picks: number;
								max_picks: number;
								paytable: Array<number>;
								max_number_of_games: bigint | string | number;
								min_rtp: number;
								max_rtp: number;
							};
						}
					>;
				};
			};
			const stakeRange = toStakeRange(
				toBigInt(kenoParameters.min_stake),
				toBigInt(kenoParameters.max_stake),
				decimals,
			);
			const configs = toConfigOptions(kenoParameters.configs.contents, decimals, (entry) => ({
				label: `Config ${entry.key}`,
				details: [
					{ label: 'Board size', value: String(entry.value.board_size) },
					{ label: 'Draw count', value: String(entry.value.draw_count) },
					{
						label: 'Picks',
						value: `${entry.value.min_picks}-${entry.value.max_picks}`,
					},
					{ label: 'Paytable', value: String(entry.value.paytable.length) },
				],
				multiplierValues: entry.value.paytable.map((value, index) => ({
					id: String(index),
					value: String(value),
				})),
			}));
			const firstPlayableConfig = configs.find((config) => config.isPlayable) ?? configs[0];
			const firstConfig = firstPlayableConfig
				? kenoParameters.configs.contents.find(
						(entry) => String(entry.key) === firstPlayableConfig.id,
					)
				: undefined;

			return {
				stakeRange,
				betCountLimit: firstConfig
					? {
							max: toBigInt(firstConfig.value.max_number_of_games),
							label: 'games',
						}
					: undefined,
				configOptions: configs,
				kenoBounds: firstConfig
					? {
							boardSize: firstConfig.value.board_size,
							drawCount: firstConfig.value.draw_count,
							minPicks: firstConfig.value.min_picks,
							maxPicks: firstConfig.value.max_picks,
							minRtp: firstConfig.value.min_rtp,
							maxRtp: firstConfig.value.max_rtp,
						}
					: undefined,
			};
		}
		case 'range': {
			const rangeParameters = parameters as StakeParameters & {
				min_zone_size: bigint | string | number;
				max_zone_size: bigint | string | number;
				min_rtp: number;
				max_rtp: number;
				max_number_of_games: bigint | string | number;
			};
			const stakeRange = toStakeRange(
				toBigInt(rangeParameters.min_stake),
				toBigInt(rangeParameters.max_stake),
				decimals,
			);

			return {
				stakeRange,
				betCountLimit: {
					max: toBigInt(rangeParameters.max_number_of_games),
					label: 'games',
				},
				rangeBounds: {
					minZoneSize: Number(rangeParameters.min_zone_size),
					maxZoneSize: Number(rangeParameters.max_zone_size),
					minRtp: rangeParameters.min_rtp,
					maxRtp: rangeParameters.max_rtp,
				},
			};
		}
		case 'plinko': {
			const plinkoParameters = parameters as StakeParameters & {
				max_number_of_balls: bigint | string | number;
				configs: {
					contents: Array<
						ConfigEntry & {
							value: ConfigEntry['value'] & {
								num_rows: number;
								multipliers: Array<number>;
							};
						}
					>;
				};
			};
			const stakeRange = toStakeRange(
				toBigInt(plinkoParameters.min_stake),
				toBigInt(plinkoParameters.max_stake),
				decimals,
			);
			const configs = toConfigOptions(plinkoParameters.configs.contents, decimals, (entry) => ({
				label: `Config ${entry.key}`,
				details: [
					{ label: 'Rows', value: String(entry.value.num_rows) },
					{ label: 'Slots', value: String(entry.value.multipliers.length) },
				],
				multiplierValues: entry.value.multipliers.map((value) => ({
					id: crypto.randomUUID(),
					value: String(value),
				})),
			}));

			return {
				stakeRange,
				betCountLimit: {
					max: toBigInt(plinkoParameters.max_number_of_balls),
					label: 'balls',
				},
				configOptions: configs,
			};
		}
		case 'wheel': {
			const wheelParameters = parameters as StakeParameters & {
				max_number_of_spins: bigint | string | number;
				configs: {
					contents: Array<
						ConfigEntry & {
							value: ConfigEntry['value'] & {
								num_cases: number;
								multipliers: Array<number>;
							};
						}
					>;
				};
			};
			const stakeRange = toStakeRange(
				toBigInt(wheelParameters.min_stake),
				toBigInt(wheelParameters.max_stake),
				decimals,
			);
			const configs = toConfigOptions(wheelParameters.configs.contents, decimals, (entry) => ({
				label: `Config ${entry.key}`,
				details: [
					{ label: 'Cases', value: String(entry.value.num_cases) },
					{
						label: 'Multipliers',
						value: String(entry.value.multipliers.length),
					},
				],
				multiplierValues: entry.value.multipliers.map((value) => ({
					id: crypto.randomUUID(),
					value: String(value),
				})),
			}));

			return {
				stakeRange,
				betCountLimit: {
					max: toBigInt(wheelParameters.max_number_of_spins),
					label: 'spins',
				},
				configOptions: configs,
			};
		}
		case 'soccer': {
			const soccerParameters = parameters as StakeParameters & {
				max_number_of_shots: bigint | string | number;
				configs: {
					contents: Array<
						ConfigEntry & {
							value: ConfigEntry['value'] & {
								shot_zone_ids: Array<number>;
								shot_zone_multipliers: Array<number>;
							};
						}
					>;
				};
				countries: {
					contents: Array<{ key: number; value: string }>;
				};
			};
			const stakeRange = toStakeRange(
				toBigInt(soccerParameters.min_stake),
				toBigInt(soccerParameters.max_stake),
				decimals,
			);
			const configs = toConfigOptions(soccerParameters.configs.contents, decimals, (entry) => ({
				label: `Config ${entry.key}`,
				details: [
					{
						label: 'Countries',
						value: String(soccerParameters.countries.contents.length),
					},
					{
						label: 'Shot zones',
						value: String(entry.value.shot_zone_ids.length),
					},
					{
						label: 'Multipliers',
						value: String(entry.value.shot_zone_multipliers.length),
					},
				],
				multiplierValues: entry.value.shot_zone_multipliers.map((value, index) => ({
					id: String(entry.value.shot_zone_ids[index]),
					value: String(value),
				})),
			}));

			return {
				stakeRange,
				betCountLimit: {
					max: toBigInt(soccerParameters.max_number_of_shots),
					label: 'shots',
				},
				configOptions: configs,
				countryOptions: soccerParameters.countries.contents.map((country) => ({
					id: String(country.key),
					label: `${country.value} (${country.key})`,
				})),
				topLevelDetails: soccerParameters.countries.contents.map((country) => ({
					label: `Country ${country.key}`,
					value: country.value,
				})),
			};
		}
		default:
			return {
				stakeRange: {
					min: '0',
					max: '0',
				},
			};
	}
}

export function summarizePvPGameParameters(
	game: PvPGameId,
	parameters: StandardGameParametersResult,
	decimals: number,
): PvPGameParametersSummary {
	switch (game) {
		case 'pvp-coinflip': {
			const pvpCoinflipParameters = parameters as {
				house_edge_bps: bigint | string | number;
				min_stake: bigint | string | number;
			};

			return {
				stakeRange: toStakeMinimum(toBigInt(pvpCoinflipParameters.min_stake), decimals),
				topLevelDetails: [
					{
						label: 'House edge (bps)',
						value: String(pvpCoinflipParameters.house_edge_bps),
					},
				],
			};
		}
		default:
			return {
				stakeRange: {
					min: '0',
					max: '0',
					kind: 'range',
				},
			};
	}
}

export function findGameConfigOption(
	parameters: StandardGameParametersSummary | null,
	configId: string,
) {
	return parameters?.configOptions?.find((option) => option.id === configId) ?? null;
}

export function resolveStakeRangeForGame(
	game: StandardGameId,
	parameters: StandardGameParametersSummary | null,
	configId?: string,
) {
	if (!parameters) {
		return null;
	}

	if ((game === 'keno' || game === 'plinko' || game === 'wheel') && configId) {
		return findGameConfigOption(parameters, configId)?.stakeRange ?? parameters.stakeRange;
	}

	return parameters.stakeRange;
}
