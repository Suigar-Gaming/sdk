// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { JSX } from 'react';
import { DefinitionList, ListPanel, Panel } from '../components/inspector-components.js';
import { asRecord } from '../lib/format.js';

function claimLabel(kind: unknown): unknown {
	return kind === 'commission'
		? 'Commission'
		: kind === 'level-up-usd-rewards'
			? 'Level-up USD rewards'
			: kind;
}

export function ReferralView({ payload }: { payload: unknown }): JSX.Element {
	const result = asRecord(payload);
	const referral = asRecord(result.referral);
	const plan = asRecord(result.plan);
	const amount =
		typeof referral.amountDisplay === 'string'
			? `${referral.amountDisplay} (${String(referral.amount)} base units)`
			: referral.amount;
	const notes = Array.isArray(referral.notes)
		? referral.notes.filter((note): note is string => typeof note === 'string')
		: Array.isArray(plan.notes)
			? plan.notes.filter((note): note is string => typeof note === 'string')
			: [];
	const target = typeof plan.target === 'string' ? [plan.target] : [];

	return (
		<>
			<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
				<Panel title="Referrer">
					<DefinitionList
						entries={[
							['Network', result.network],
							['Address', result.owner],
							['Reward', claimLabel(referral.kind)],
							['Coin type', referral.coinType],
						]}
					/>
				</Panel>
				<Panel title="Claimable reward">
					<DefinitionList
						entries={[
							['Amount', amount],
							['Package ID', referral.packageId],
						]}
					/>
				</Panel>
			</section>
			<ListPanel className="targets" items={target} title="Claim target" />
			<ListPanel className="notes" items={notes} title="Notes" />
		</>
	);
}
