// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord, dynamicEntries } from '../lib/format.js';
import type { DefinitionEntry } from '../lib/types.js';

export function ConfigView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const config = asRecord(result.config);
	const sdk = asRecord(config.sdk);
	const supportedGames = Array.isArray(result.supportedGames)
		? result.supportedGames.map((item) => asRecord(item))
		: [];
	const supportedFeatures = Array.isArray(result.supportedFeatures)
		? result.supportedFeatures.map((item) => asRecord(item))
		: [];

	return (
		<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
			<Panel title="Context">
				<DefinitionList entries={[['Network', result.network]]} />
			</Panel>
			<Panel title="SDK configuration">
				<DefinitionList entries={dynamicEntries(sdk)} />
			</Panel>
			<Panel title="Available tools">
				<DefinitionList
					entries={[
						['Configuration', 'read_config'],
						['Game metadata', 'read_game_metadata'],
						...supportedGames.map((game): DefinitionEntry => [
							String(game.label ?? game.id),
							Array.isArray(game.tools) ? game.tools.join(', ') : null,
						]),
						...supportedFeatures.map((feature): DefinitionEntry => [
							String(feature.label ?? feature.id),
							Array.isArray(feature.tools) ? feature.tools.join(', ') : null,
						]),
					]}
				/>
			</Panel>
		</section>
	);
}
