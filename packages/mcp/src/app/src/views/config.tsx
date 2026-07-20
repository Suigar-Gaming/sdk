// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord, dynamicEntries } from '../lib/format.js';

export function ConfigView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const config = asRecord(result.config);
	const sdk = asRecord(config.sdk);
	const supportedGames = Array.isArray(result.supportedGames)
		? result.supportedGames.map((item) => asRecord(item))
		: [];

	return (
		<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
			<Panel title="Context">
				<DefinitionList entries={[['Network', result.network]]} />
			</Panel>
			<Panel title="SDK configuration">
				<DefinitionList entries={dynamicEntries(sdk)} />
			</Panel>
			<Panel hidden={supportedGames.length === 0} title="Supported games">
				<DefinitionList
					entries={supportedGames.map((game) => [
						String(game.label ?? game.id),
						Array.isArray(game.tools) ? game.tools.join(', ') : null,
					])}
				/>
			</Panel>
		</section>
	);
}
