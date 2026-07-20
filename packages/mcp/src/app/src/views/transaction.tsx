// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	DefinitionList,
	ListPanel,
	Panel,
} from '../components/inspector-components.js';
import { visibleDefinitionEntries } from '../lib/format.js';
import { createInspectorViewModel } from '../lib/inspector.js';

export function TransactionView({
	payload,
	errors,
}: {
	payload: unknown;
	errors: string[];
}) {
	const viewModel = createInspectorViewModel(payload, errors);

	return (
		<>
			<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
				<Panel title="Context">
					<DefinitionList entries={viewModel.contextEntries} />
				</Panel>
				<Panel
					hidden={
						visibleDefinitionEntries(viewModel.transactionEntries).length === 0
					}
					title="Transaction"
				>
					<DefinitionList entries={viewModel.transactionEntries} />
				</Panel>
				<Panel
					hidden={visibleDefinitionEntries(viewModel.gasEntries).length === 0}
					title="Gas"
				>
					<DefinitionList entries={viewModel.gasEntries} />
				</Panel>
				<Panel
					hidden={
						visibleDefinitionEntries(viewModel.dryRunEntries).length === 0
					}
					title="Dry-run"
				>
					<DefinitionList entries={viewModel.dryRunEntries} />
				</Panel>
			</section>
			<ListPanel
				className="targets"
				items={viewModel.targets}
				title="Targets"
			/>
			<ListPanel className="notes" items={viewModel.notes} title="Notes" />
			<ListPanel className="errors" items={viewModel.errors} title="Errors" />
		</>
	);
}
