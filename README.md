# `@suigar/sdk`

TypeScript SDK for building Suigar v2 game transactions on Sui.

## Installation

```bash
npm install @suigar/sdk
```

Runtime requirements:

- Node.js `>=22`
- `@mysten/sui`

## What This Package Exposes

The package root currently exposes the extension factory:

```ts
import { suigar } from '@suigar/sdk';
```

It does not export the individual transaction builders from the package root.
It also does not export `SuigarClient` as a public root symbol.

What you actually use at runtime is the registered extension instance:

```ts
const client = new SuiClient({ url }).$extend(suigar());

client.suigar.serializeTransactionToBase64(...);
client.suigar.bcs;
client.suigar.tx;
```

## Quick Start

```ts
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';
import { suigar } from '@suigar/sdk';

const client = new SuiClient({
	url: getFullnodeUrl('testnet'),
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
const client = new SuiClient({ url }).$extend(suigar());

client.suigar;
```

You can rename the extension:

```ts
const client = new SuiClient({ url }).$extend(suigar({ name: 'casino' }));

client.casino.tx;
client.casino.bcs;
```

## Config

`suigar(options?)` resolves config from:

- internal package ids by network
- default coin types for `SUI`, `USDC`, and FlowX `USDC`
- the connected Sui client network
- the extension name

Supported override areas:

- `name`

## Runtime Surface

The registered extension instance exposes three main areas:

- `serializeTransactionToBase64(transaction, options?)`
- `bcs`
- `tx`

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
- the SDK resolves the Pyth price info object from the configured coin mapping
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

These are generated Move struct/event decoders. Use them to parse Suigar event payloads and structured onchain content.

### Parse Standard Bet Result Data

```ts
const { object } = await client.core.getObject({
	objectId: '0xOBJECT_ID',
	include: {
		content: true,
	},
});

const decoded = client.suigar.bcs.BetResultEvent.parse(object.content);
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

- use `content`, not `objectBcs`, with these generated parsers
- the generated parser expects the struct payload, not a full object envelope

### Parse PvP Coinflip Event Data

Use the matching helper for the PvP coinflip event payload you fetched from chain:

- `client.suigar.bcs.PvPCoinflipGameCreated`
- `client.suigar.bcs.PvPCoinflipGameResolved`
- `client.suigar.bcs.PvPCoinflipGameCancelled`

## Development

```bash
npm run build
npm run typecheck
npm test
```
