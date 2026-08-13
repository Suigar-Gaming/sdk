// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord } from '../lib/format.js';

export function SessionWalletView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const sessionWallet = asRecord(result.sessionWallet);
	const funding = asRecord(sessionWallet.funding);
	const qrCode =
		typeof funding.addressQrCodeDataUrl === 'string' ? funding.addressQrCodeDataUrl : null;
	const balances = Array.isArray(sessionWallet.balances) ? sessionWallet.balances : [];
	const fundingUrl = typeof funding.fundingUrl === 'string' ? funding.fundingUrl : null;
	const setupUrl = typeof sessionWallet.setupUrl === 'string' ? sessionWallet.setupUrl : null;

	if (setupUrl) {
		return (
			<section className="grid grid-cols-1 gap-3.5">
				<Panel title="Set up your session wallet">
					<p className="text-xs font-semibold leading-5 text-muted-foreground">
						{typeof sessionWallet.note === 'string'
							? sessionWallet.note
							: 'Create or recover the session wallet shared by mainnet and testnet.'}
					</p>
					<a
						className="inline-flex min-h-10 w-max items-center justify-center rounded-md border border-primary/75 bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
						href={setupUrl}
						rel="noreferrer"
						target="_blank"
					>
						Open local setup page
					</a>
				</Panel>
			</section>
		);
	}

	return (
		<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
			<Panel title="Session wallet">
				<DefinitionList
					entries={[
						['Networks', 'Mainnet and testnet'],
						['Balance network', result.network],
						['Address', sessionWallet.address],
						['Status', sessionWallet.status],
					]}
				/>
			</Panel>
			<Panel title="Balances">
				{balances.length === 0 ? (
					<p className="text-xs font-semibold text-muted-foreground">
						No balances found for this wallet.
					</p>
				) : (
					<dl className="grid gap-2">
						{balances.map((item) => {
							const balance = asRecord(item);
							return (
								<div className="flex justify-between gap-3 text-xs" key={String(balance.coinType)}>
									<dt
										className="truncate font-mono text-muted-foreground"
										title={String(balance.coinType)}
									>
										{String(balance.symbol ?? balance.coinType)}
									</dt>
									<dd className="shrink-0 font-mono font-bold">
										{String(balance.balanceDisplay ?? balance.balance)}{' '}
										{typeof balance.symbol === 'string' ? balance.symbol : ''}
									</dd>
								</div>
							);
						})}
					</dl>
				)}
			</Panel>
			<Panel title="Fund this wallet">
				{qrCode ? (
					<div className="grid justify-items-center gap-3">
						<img
							alt="QR code for the session wallet address"
							className="size-48 rounded-md border border-border/70 bg-white p-2"
							height={192}
							src={qrCode}
							width={192}
						/>
						<p className="text-center text-xs font-semibold leading-5 text-muted-foreground">
							{typeof funding.note === 'string'
								? funding.note
								: 'Scan this code in a Sui wallet to fund the session wallet.'}
						</p>
						{fundingUrl ? (
							<a
								className="inline-flex min-h-10 items-center justify-center rounded-md border border-primary/75 bg-primary px-4 py-2 text-sm font-extrabold text-primary-foreground"
								href={fundingUrl}
								rel="noreferrer"
								target="_blank"
							>
								Fund from paired wallet
							</a>
						) : null}
					</div>
				) : (
					<p className="text-xs font-semibold text-muted-foreground">
						No funding QR code is available.
					</p>
				)}
			</Panel>
		</section>
	);
}
