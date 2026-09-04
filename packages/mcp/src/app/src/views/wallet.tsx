// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, InspectorTable, Panel } from '../components/inspector-components.js';
import { asRecord } from '../lib/format.js';

export function WalletView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const wallet = asRecord(result.wallet);
	const balances = Array.isArray(wallet.balances) ? wallet.balances : [];
	const coins = Array.isArray(wallet.coins) ? wallet.coins : [];

	return (
		<section className="grid grid-cols-1 gap-3.5">
			<Panel title="Wallet">
				<DefinitionList
					entries={[
						['Network', result.network],
						['Owner', wallet.owner],
						['Has next page', wallet.hasNextPage],
						['Next cursor', wallet.nextCursor],
					]}
				/>
			</Panel>
			<Panel hidden={!('balances' in wallet)} title="Balances">
				{balances.length === 0 ? (
					<p className="text-muted-foreground text-xs font-semibold">
						No balances found for this wallet.
					</p>
				) : (
					<InspectorTable headers={['Coin', 'Balance']}>
						{balances.map((item) => {
							const balance = asRecord(item);
							return (
								<tr className="bg-card/45" key={String(balance.coinType)}>
									<td
										className="max-w-72 truncate px-3 py-2 font-mono"
										title={String(balance.coinType)}
									>
										{String(balance.symbol ?? balance.coinType)}
									</td>
									<td className="px-3 py-2 font-mono">
										{String(balance.balanceDisplay ?? balance.balance)}{' '}
										{typeof balance.symbol === 'string' ? balance.symbol : ''}
									</td>
								</tr>
							);
						})}
					</InspectorTable>
				)}
			</Panel>
			<Panel hidden={!('coins' in wallet)} title="Coin objects">
				{coins.length === 0 ? (
					<p className="text-muted-foreground text-xs font-semibold">
						No coin objects found for this page.
					</p>
				) : (
					<InspectorTable headers={['Balance', 'Coin']}>
						{coins.map((item) => {
							const coin = asRecord(item);
							return (
								<tr className="bg-card/45" key={String(coin.objectId)}>
									<td className="px-3 py-2 font-mono">
										{String(coin.balanceDisplay ?? coin.balance)}{' '}
										{typeof coin.symbol === 'string' ? coin.symbol : ''}
									</td>
									<td className="max-w-72 truncate px-3 py-2 font-mono" title={String(coin.type)}>
										{String(coin.symbol ?? coin.type)}
									</td>
								</tr>
							);
						})}
					</InspectorTable>
				)}
			</Panel>
		</section>
	);
}
