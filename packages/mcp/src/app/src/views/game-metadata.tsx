// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord, dynamicEntries } from '../lib/format.js';

export function GameMetadataView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const game = asRecord(result.game);

	return (
		<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
			<Panel title="Context">
				<DefinitionList
					entries={[
						['Network', result.network],
						['Game', game.label ?? game.id],
						['Coin type', game.coinType],
						['Package ID', game.packageId],
						['Ignored cache', game.ignoreCache],
					]}
				/>
			</Panel>
			<Panel title="Live parameters">
				<DefinitionList entries={dynamicEntries(asRecord(game.parameters))} />
			</Panel>
		</section>
	);
}
