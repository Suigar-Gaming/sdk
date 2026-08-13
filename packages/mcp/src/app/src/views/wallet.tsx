// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import type { ReactNode } from 'react';
import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord } from '../lib/format.js';

function WalletTable({ children, headers }: { children: ReactNode; headers: Array<string> }) {
	return (
		<div className="overflow-x-auto rounded-md border border-border/70">
			<table className="min-w-full border-collapse text-left text-xs leading-5">
				<thead className="bg-background/75 text-muted-foreground">
					<tr>
						{headers.map((header) => (
							<th className="px-3 py-2 font-extrabold" key={header} scope="col">
								{header}
							</th>
						))}
					</tr>
				</thead>
				<tbody className="divide-y divide-border/70">{children}</tbody>
			</table>
		</div>
	);
}

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
					<p className="text-xs font-semibold text-muted-foreground">
						No balances found for this wallet.
					</p>
				) : (
					<WalletTable headers={['Coin', 'Balance']}>
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
					</WalletTable>
				)}
			</Panel>
			<Panel hidden={!('coins' in wallet)} title="Coin objects">
				{coins.length === 0 ? (
					<p className="text-xs font-semibold text-muted-foreground">
						No coin objects found for this page.
					</p>
				) : (
					<WalletTable headers={['Balance', 'Coin']}>
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
					</WalletTable>
				)}
			</Panel>
		</section>
	);
}
