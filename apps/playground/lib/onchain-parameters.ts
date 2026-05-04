'use client';

import type { SuigarClient } from '@suigar/sdk';
import { fromMoveFloat, toBigInt } from '@suigar/sdk/utils';
import type {
	GameConfigOption,
	StakeRangeSummary,
	StandardGameId,
	StandardGameParametersSummary,
} from '@/lib/suigar-types';

type StandardGameParametersResult = Awaited<
	ReturnType<SuigarClient['getGameParameters']>
>;

type StakeParameters = {
	min_stake: bigint | string | number;
	max_stake: bigint | string | number;
};

type MoveFloatLike = Parameters<typeof fromMoveFloat>[0];

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

	const trimmedFraction = fraction
		.toString()
		.padStart(decimals, '0')
		.replace(/0+$/, '');

	return `${whole.toString()}.${trimmedFraction}`;
}

function toStakeRange(
	minStake: bigint,
	maxStake: bigint,
	decimals: number,
): StakeRangeSummary {
	return {
		min: formatAtomicAmount(minStake, decimals),
		max: formatAtomicAmount(maxStake, decimals),
	};
}

function toConfigOptions<TEntry extends ConfigEntry>(
	entries: TEntry[],
	decimals: number,
	buildConfig: (
		entry: TEntry,
	) => Pick<
		GameConfigOption,
		'label' | 'description' | 'details' | 'multiplierValues'
	>,
): GameConfigOption[] {
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
				min_target_multiplier: MoveFloatLike;
				max_target_multiplier: MoveFloatLike;
			};
			const stakeRange = toStakeRange(
				toBigInt(limboParameters.min_stake),
				toBigInt(limboParameters.max_stake),
				decimals,
			);

			return {
				stakeRange,
				targetMultiplierRange: {
					min: fromMoveFloat(limboParameters.min_target_multiplier),
					max: fromMoveFloat(limboParameters.max_target_multiplier),
				},
			};
		}
		case 'range': {
			const rangeParameters = parameters as StakeParameters & {
				min_zone_size: bigint | string | number;
				max_zone_size: bigint | string | number;
				min_rtp: MoveFloatLike;
				max_rtp: MoveFloatLike;
			};
			const stakeRange = toStakeRange(
				toBigInt(rangeParameters.min_stake),
				toBigInt(rangeParameters.max_stake),
				decimals,
			);

			return {
				stakeRange,
				rangeBounds: {
					minZoneSize: Number(rangeParameters.min_zone_size),
					maxZoneSize: Number(rangeParameters.max_zone_size),
					minRtp: fromMoveFloat(rangeParameters.min_rtp),
					maxRtp: fromMoveFloat(rangeParameters.max_rtp),
				},
			};
		}
		case 'plinko': {
			const plinkoParameters = parameters as StakeParameters & {
				configs: {
					contents: Array<
						ConfigEntry & {
							value: ConfigEntry['value'] & {
								num_rows: number;
								multipliers: MoveFloatLike[];
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
			const configs = toConfigOptions(
				plinkoParameters.configs.contents,
				decimals,
				(entry) => ({
					label: `Config ${entry.key}`,
					description: 'Plinko board parameters and allowed stake range.',
					details: [
						{ label: 'Rows', value: String(entry.value.num_rows) },
						{ label: 'Slots', value: String(entry.value.multipliers.length) },
					],
					multiplierValues: entry.value.multipliers.map((value) =>
						String(fromMoveFloat(value)),
					),
				}),
			);

			return { stakeRange, configOptions: configs };
		}
		case 'wheel': {
			const wheelParameters = parameters as StakeParameters & {
				configs: {
					contents: Array<
						ConfigEntry & {
							value: ConfigEntry['value'] & {
								num_cases: number;
								multipliers: MoveFloatLike[];
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
			const configs = toConfigOptions(
				wheelParameters.configs.contents,
				decimals,
				(entry) => ({
					label: `Config ${entry.key}`,
					description: 'Wheel case layout and allowed stake range.',
					details: [
						{ label: 'Cases', value: String(entry.value.num_cases) },
						{
							label: 'Multipliers',
							value: String(entry.value.multipliers.length),
						},
					],
					multiplierValues: entry.value.multipliers.map((value) =>
						String(fromMoveFloat(value)),
					),
				}),
			);

			return { stakeRange, configOptions: configs };
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

export function findGameConfigOption(
	parameters: StandardGameParametersSummary | null,
	configId: string,
) {
	return (
		parameters?.configOptions?.find((option) => option.id === configId) ?? null
	);
}

export function resolveStakeRangeForGame(
	game: StandardGameId,
	parameters: StandardGameParametersSummary | null,
	configId?: string,
) {
	if (!parameters) {
		return null;
	}

	if ((game === 'plinko' || game === 'wheel') && configId) {
		return (
			findGameConfigOption(parameters, configId)?.stakeRange ??
			parameters.stakeRange
		);
	}

	return parameters.stakeRange;
}
