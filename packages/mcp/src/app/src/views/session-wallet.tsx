// Copyright (c) Suigar
// SPDX-License-Identifier: Apache-2.0

import { DefinitionList, Panel } from '../components/inspector-components.js';
import { asRecord } from '../lib/format.js';

export function SessionWalletView({ payload }: { payload: unknown }) {
	const result = asRecord(payload);
	const sessionWallet = asRecord(result.sessionWallet);
	const funding = asRecord(sessionWallet.funding);
	const qrCode =
		typeof funding.addressQrCodeDataUrl === 'string'
			? funding.addressQrCodeDataUrl
			: null;

	return (
		<section className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
			<Panel title="Session wallet">
				<DefinitionList
					entries={[
						['Network', result.network],
						['Address', sessionWallet.address],
						['Status', sessionWallet.status],
					]}
				/>
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
