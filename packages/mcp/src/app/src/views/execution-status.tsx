// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import {
	DefinitionList,
	ListPanel,
	Panel,
} from '../components/inspector-components.js';
import { asRecord } from '../lib/format.js';

export function ExecutionStatusView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const execution = asRecord(result.execution);

	return (
		<section className="grid grid-cols-1 gap-3.5">
			<Panel title="Transaction Status">
				<DefinitionList
					entries={[
						['Network', result.network],
						['Status', execution.status],
						['Transaction digest', execution.digest],
						['Request ID', execution.requestId],
					]}
				/>
			</Panel>
			<ListPanel
				className="errors"
				items={typeof execution.error === 'string' ? [execution.error] : []}
				title="Execution Error"
			/>
		</section>
	);
}
