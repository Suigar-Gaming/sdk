import { createDAppKit } from '@mysten/dapp-kit-core';
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suigar } from '@suigar/sdk';

const GRPC_URLS = {
	testnet: 'https://fullnode.testnet.sui.io:443',
} as const;

export const dAppKit = createDAppKit({
	networks: ['testnet'],
	defaultNetwork: 'testnet',
	autoConnect: true,
	createClient: (network) =>
		new SuiGrpcClient({
			network,
			baseUrl: GRPC_URLS[network],
		}).$extend(suigar()),
});

declare module '@mysten/dapp-kit-react' {
	interface Register {
		dAppKit: typeof dAppKit;
	}
}
