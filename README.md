# `@suigar/sdk`

TypeScript SDK for building Suigar v2 game transactions on Sui.

## Installation

```bash
npm install --save @suigar/sdk @mysten/sui @mysten/bcs
```

Runtime requirements:

- Node.js `>=22`
- ESM project configuration (`"type": "module"`)
- `@mysten/sui` v2
- `@mysten/bcs` v2

This SDK targets Sui TypeScript SDK 2.0+ only. Follow the official [Sui 2.0 migration guide](https://sdk.mystenlabs.com/sui/migrations/sui-2.0) if your app still uses the pre-2.0 client API.

## What This Package Exposes

The package root currently exposes the extension factory:

```ts
import { suigar } from '@suigar/sdk';
```

It does not export the individual transaction builders from the package root.
It also does not export `SuigarClient` as a public root symbol.

Parser and helper utilities are available from the single utils subpath:

```ts
import { parseFloat, parseI64 } from '@suigar/sdk/utils';
```

What you actually use at runtime is the registered extension instance:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(suigar());

client.suigar.serializeTransactionToBase64(...);
client.suigar.getConfig();
client.suigar.bcs;
client.suigar.tx;
```

## Quick Start

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suigar } from '@suigar/sdk';

const client = new SuiGrpcClient({
	baseUrl: 'https://fullnode.testnet.sui.io:443',
	network: 'testnet',
}).$extend(suigar());

const tx = client.suigar.tx.createBetTransaction('coinflip', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});

const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

## Extension Registration

### `suigar(options?)`

Creates a named Sui client extension. By default, it registers under `client.suigar`.

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(suigar());

client.suigar;
```

You can rename the extension:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ name: 'games' }),
);

client.games.tx;
client.games.bcs;
```

## Config

`suigar(options?)` resolves config from:

- internal package ids by network
- internal supported coin types by network
- internal price info object ids by network
- the connected client network
- the extension name

Supported override areas:

- `name`

## Runtime Surface

The registered extension instance exposes three main areas:

- `getConfig()`
- `serializeTransactionToBase64(transaction, options?)`
- `bcs`
- `tx`

### `getConfig()`

Returns the resolved SDK configuration for the connected network.

This is intended mainly for debugging and inspection, for example to verify the
resolved package ids or supported coin mappings for the active client network.

It includes:

- `packageIds`
- `coinTypes`
- `priceInfoObjectIds`

```ts
const config = client.suigar.getConfig();
console.log(config.packageIds);
```

### `serializeTransactionToBase64(transaction, options?)`

Builds a transaction with the configured Sui client and returns base64-encoded transaction bytes.

Use this when you need a transport-safe payload for a wallet, API, or external signer.

```ts
const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

## `tx`

Transaction builders live under `client.suigar.tx`.

### Standard Games

Use `createBetTransaction(gameId, options)` for:

- `coinflip`
- `limbo`
- `plinko`
- `range`
- `wheel`

```ts
const tx = client.suigar.tx.createBetTransaction('coinflip', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'tails',
});
```

Shared option shape:

- `owner: string`
- `coinType: string`
- `stake: number | bigint`
- `cashStake?: number | bigint`
- `betCount?: number | bigint`
- `metadata?: Record<string, string | number | boolean | bigint | Uint8Array | number[] | null | undefined>`
- `gasBudget?: number | bigint`
- `sender?: string`
- `allowGasCoinShortcut?: boolean`

Shared behavior:

- `stake` is the logical stake passed into the Move call
- `cashStake` controls the withdrawn balance and defaults to `stake`
- `betCount` defaults to `1`
- `sender` overrides the transaction sender
- `metadata` is encoded into `keys` and `values` byte arrays
- the SDK resolves the price info object from the configured supported-coin mapping
- the reward object is transferred back to `owner`

Per-game options:

- `coinflip`: `side: 'heads' | 'tails'`
- `limbo`: `targetMultiplier: number`, `scale?: number`
- `plinko`: `configId: number`
- `range`: `leftPoint: number`, `rightPoint: number`, `outOfRange?: boolean`, `scale?: number`
- `wheel`: `configId: number`

Examples:

```ts
const limboTx = client.suigar.tx.createBetTransaction('limbo', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	targetMultiplier: 2.5,
});

const rangeTx = client.suigar.tx.createBetTransaction('range', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	leftPoint: 0.95,
	rightPoint: 1.05,
	outOfRange: false,
});
```

Notes:

- limbo converts `targetMultiplier` with `Math.round(targetMultiplier * scale)`
- range converts each point with `Math.round(value * scale)`
- plinko and wheel `configId` must fit in `u8`

### PvP Coinflip

Use `createPvPCoinflipTransaction(action, options)` for PvP coinflip flows:

- `create`
- `join`
- `cancel`

Create:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('create', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
	isPrivate: false,
});
```

Join:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('join', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME_ID',
	extraObjectId: '0xEXTRA_OBJECT_ID',
	stake: 1_000_000_000n,
});
```

Cancel:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('cancel', {
	owner: '0x123',
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME_ID',
});
```

PvP shared options:

- `owner: string`
- `coinType: string`
- `metadata?: ...`
- `gasBudget?: number | bigint`
- `sender?: string`
- `allowGasCoinShortcut?: boolean`

Action-specific options:

- `create`: `stake`, `side`, `isPrivate?`
- `join`: `gameId`, `extraObjectId`, `stake`
- `cancel`: `gameId`

## `bcs`

BCS helpers live under `client.suigar.bcs`.

Current exposed helpers:

- `BetResultEvent`
- `PvPCoinflipGameCreated`
- `PvPCoinflipGameResolved`
- `PvPCoinflipGameCancelled`

These are generated Move event decoders. Use them to parse Suigar event payloads from transaction results.

### Parse Standard Bet Result Data

```ts
const executeResult = await client.core.executeTransaction({
	transaction: transactionBytes,
	signatures: [signature],
	include: {
		events: true,
	},
});

const finalResult = await client.core.waitForTransaction({
	result: executeResult,
	include: {
		effects: true,
		events: true,
	},
});

if (finalResult.$kind === 'FailedTransaction') {
	throw new Error(finalResult.FailedTransaction.status.error?.message);
}

console.log(finalResult.Transaction.digest);

const transactionResult = finalResult.Transaction;

const betResults = [];

for (const event of transactionResult.events ?? []) {
	try {
		const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
		betResults.push(decoded);
	} catch {
		// Ignore non-BetResultEvent payloads.
	}
}
```

Parsed fields include:

- `player`
- `coin_type`
- `stake_amount`
- `unsafe_oracle_usd_coin_price`
- `adjusted_oracle_usd_coin_price`
- `outcome_amount`
- `game_details`
- `metadata`

`game_details` and `metadata` decode as `VecMap<string, vector<u8>>`-shaped data, so values come back as byte arrays.

```ts
const textDecoder = new TextDecoder();

const metadata = new Map(
	decoded.metadata.contents.map(({ key, value }) => [
		key,
		textDecoder.decode(new Uint8Array(value)),
	]),
);
```

Important:

- execute or wait for the transaction with `include: { events: true }`
- unwrap the core API union with `result.$kind`, `result.Transaction`, and `result.FailedTransaction`
- parse emitted events from the unwrapped transaction result
- use `event.bcs` for consistent decoding across transports
- `waitForTransaction({ result, include: { effects: true, events: true } })` is useful when you want the finalized transaction result before decoding
- these helpers decode the event payload itself, not a full transaction response

### Parse PvP Coinflip Event Data

Use the matching helper for each PvP coinflip event payload found in `transactionResult.events`:

- `client.suigar.bcs.PvPCoinflipGameCreated`
- `client.suigar.bcs.PvPCoinflipGameResolved`
- `client.suigar.bcs.PvPCoinflipGameCancelled`

## Development

```bash
npm run build
npm run typecheck
npm test
```

## Example App

This repository now includes a Next.js integration example in [examples/game-integration](/Users/lucas/Documents/Github/suigar-sdk/examples/game-integration).

It demonstrates:

- standard game transactions through `client.suigar.tx.createBetTransaction(...)`
- PvP coinflip create, join, and cancel flows through `client.suigar.tx.createPvPCoinflipTransaction(...)`
- wallet connection and execution with `@mysten/dapp-kit-core` and `@mysten/dapp-kit-react`
- supported coin selection from `client.suigar.getConfig()`
- decoding `BetResultEvent` and PvP events into a persistent event log

Run it from the repo root with:

```bash
npm --prefix examples/game-integration install
npm --prefix examples/game-integration run dev
```
