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
import { parseFloat, parseGameDetails, parseI64 } from '@suigar/sdk/utils';
```

What you actually use at runtime is the registered extension instance:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(suigar());

client.suigar.serializeTransactionToBase64(...);
client.suigar.getConfig();
client.suigar.resolvePvPConflipGame(...);
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
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ partner: 'my-partner' }),
);

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
- `partner`

If `partner` is configured, the SDK automatically writes it into the onchain
metadata vec-map. Transaction builder options may also include `metadata`, but
reserved keys such as `partner` and `referrer` are ignored with a warning when
provided manually.

## Runtime Surface

The registered extension instance exposes the main runtime surface:

- `getConfig()`
- `serializeTransactionToBase64(transaction, options?)`
- `resolvePvPConflipGame(gameId)`
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

### `resolvePvPConflipGame(gameId)`

Fetches a PvP coinflip game object from chain and parses its `content` into the
generated `PvPCoinflipGame` shape.

Use this when a product needs the live onchain match state before rendering a
lobby, gating join or cancel actions, or inspecting the resolved stake and
privacy flag for a game.

```ts
const game = await client.suigar.resolvePvPConflipGame('0xGAME_ID');

console.log(game.owner);
console.log(game.stake_per_player);
console.log(game.is_private);
```

Notes:

- it throws if the object response does not include decodable `content`
- the PvP join builder uses this internally to derive the required join stake
- prefer this helper over manual object parsing when you only need the parsed game

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
- `partner` configured via `suigar({ partner })` is appended automatically to metadata
- `metadata.partner` and `metadata.referrer` are reserved and ignored with a warning
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

Join derives the stake from `gameId` and uses the configured price info object
id for `coinType`.

PvP shared options:

- `owner: string`
- `coinType: string`
- `metadata?: Record<string, string | number | boolean | bigint | Uint8Array | number[] | null | undefined>`
- `gasBudget?: number | bigint`
- `sender?: string`
- `allowGasCoinShortcut?: boolean`

Action-specific options:

- `create`: `stake`, `side`, `isPrivate?`
- `join`: `gameId`
- `cancel`: `gameId`

## `bcs`

BCS helpers live under `client.suigar.bcs`.

Current exposed helpers:

- `PvPCoinflipGame`
- `BetResultEvent`
- `PvPCoinflipGameCreated`
- `PvPCoinflipGameResolved`
- `PvPCoinflipGameCancelled`

These are generated Move event decoders. Use them to parse Suigar event payloads from transaction results. The `@suigar/sdk/utils` subpath also exposes parser helpers for generated BCS values:

- `PvPCoinflipGame` parses a PvP coinflip game object's `content`
- `parseI64(float.exp)` converts a generated Move `i64` exponent to a JavaScript number
- `parseFloat(float)` converts a generated Move `Float` struct to a JavaScript number
- `parseGameDetails(game_details)` decodes `BetResultEvent.game_details` entries into the expected string, number, and boolean values

### Parse PvP Coinflip Game Object Data

Use the BCS helper directly when you already fetched the object with `content`:

```ts
const objectResult = await client.core.getObject({
	objectId: '0xGAME_ID',
	include: { content: true },
});

if (!objectResult.object.content) {
	throw new Error('Missing game content');
}

const parsed = client.suigar.bcs.PvPCoinflipGame.parse(
	objectResult.object.content,
);
```

If you only need the parsed game object, prefer the convenience method:

```ts
const parsed = await client.suigar.resolvePvPConflipGame('0xGAME_ID');
```

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

`game_details` and `metadata` decode as `VecMap<string, vector<u8>>`-shaped data, so values come back as byte arrays. Use `parseGameDetails` from `@suigar/sdk/utils` to decode `game_details` with the SDK's known game-detail schemas.

```ts
import { parseGameDetails } from '@suigar/sdk/utils';

const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(decoded.game_details);
```

`parseGameDetails` preserves the onchain keys and only changes the value representation. For example, coinflip details keep keys such as `player_bet` and `coin_outcome`; range details keep keys such as `roll_value`, `win`, and `payout_multiplier`.

When the extension is configured with `partner`, decoded event `metadata` will
contain that `partner` entry.

Important:

- execute or wait for the transaction with `include: { events: true }`
- unwrap the core API union with `result.$kind`, `result.Transaction`, and `result.FailedTransaction`
- parse emitted events from the unwrapped transaction result
- use `event.bcs` for consistent decoding across transports
- use `parseGameDetails(decoded.game_details)` instead of hand-decoding standard game detail byte arrays
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
- parsing `BetResultEvent.game_details` with `parseGameDetails`

Run it from the repo root with:

```bash
npm --prefix examples/game-integration install
npm --prefix examples/game-integration run dev
```
