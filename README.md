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

The package ships three public entrypoints:

- `@suigar/sdk` for the extension factory and runtime client class
- `@suigar/sdk/games` for game-specific public types
- `@suigar/sdk/utils` for public parser, constants, and numeric helpers

The package root exposes the extension factory and client class:

```ts
import { suigar, SuigarClient } from '@suigar/sdk';
```

It does not export the individual transaction builders from the package root.
Those stay on the registered extension instance under `client.suigar.tx`.

Utility exports are available from the utils subpath:

```ts
import {
	DEFAULT_GAS_BUDGET_MIST,
	DEFAULT_LIMBO_MULTIPLIER_SCALE,
	DEFAULT_RANGE_SCALE,
	RANGE_POINT_LIMIT,
	parseFloat,
	parseGameDetails,
	parseI64,
	toBigIntAmount,
	toU8Number,
} from '@suigar/sdk/utils';
```

Game-specific type exports are available from the dedicated `games` subpath:

```ts
import type {
	BuildCoinflipTransactionOptions,
	CoinSide,
} from '@suigar/sdk/games';
import type {
	BuildCreatePvPCoinflipTransactionOptions,
	PvPCoinflipAction,
} from '@suigar/sdk/games';
```

Current game-type subpath exports:

- `@suigar/sdk/games`: `CoinSide`, `PvPCoinflipAction`, `BuildCoinflipTransactionOptions`, `BuildLimboTransactionOptions`, `BuildPlinkoTransactionOptions`, `BuildRangeTransactionOptions`, `BuildWheelTransactionOptions`, `BuildCreatePvPCoinflipTransactionOptions`, `BuildJoinPvPCoinflipTransactionOptions`, `BuildCancelPvPCoinflipTransactionOptions`

What you actually use at runtime is the registered extension instance:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(suigar());

client.suigar.serializeTransactionToBase64(...);
client.suigar.getConfig();
client.suigar.getPvPCoinflipGames(...);
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

### Partner Setup

> [!IMPORTANT]
> `partner` is the partner wallet address. Configure it once when you
> register the extension so the SDK can append that wallet address to supported
> bet metadata automatically.

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ partner: '0xpartner_wallet_address' }),
);

client.suigar;
```

Do not pass a partner slug, label, or display name here. Use the wallet
address that should receive partner attribution onchain.

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

If `partner` is configured, the SDK automatically writes that partner wallet
address into the onchain metadata vec-map. Transaction builder options may also
include `metadata`, but reserved keys such as `partner` and `referrer` are
ignored with a warning when provided manually.

## Runtime Surface

The registered extension instance exposes the main runtime surface:

- `getConfig()`
- `serializeTransactionToBase64(transaction, options?)`
- `getPvPCoinflipGames(options?)`
- `resolvePvPConflipGame(gameId)`
- `bcs`
- `tx`

### `getConfig()`

Returns the resolved SDK configuration for the connected network.

This is intended mainly for debugging and inspection, for example to verify the
resolved package ids or supported coin mappings for the active client network.

It includes:

- `packageIds`
- `registryIds`
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

### `getPvPCoinflipGames(options?)`

Lists unresolved PvP coinflip games from the configured PvP registry.

This reads the registry dynamic fields for the active network and resolves each
entry into parsed game state through `resolvePvPConflipGame()`. Registry
membership is the unresolved-state signal: once a match is joined and resolved,
the Move flow removes it from the registry and deletes the live `Game` object.

Use this when a product needs the current set of open PvP coinflip matches for
browsing or lobby views.

By default, failures to resolve an individual game are skipped so one broken or
already-deleted registry entry does not reject the full lookup. Pass
`rejectOnError: true` if you want the call to reject instead.

```ts
const games = await client.suigar.getPvPCoinflipGames({ limit: 20 });

for (const game of games) {
	console.log(game.id);
	console.log(game.coinType);
}
```

```ts
const games = await client.suigar.getPvPCoinflipGames({
	limit: 20,
	rejectOnError: true,
});
```

### `resolvePvPConflipGame(gameId)`

Fetches a PvP coinflip game object from chain and parses it into the SDK's
normalized runtime shape.

This requires the object's `content`, decodes it with the generated
`PvPCoinflipGame` parser, and normalizes the generic coin type into a standard
struct tag string.

Use this when a product needs the live onchain match state for a specific
pending match before rendering join or cancel actions, or inspecting the stake
and privacy flag for a game.

```ts
const game = await client.suigar.resolvePvPConflipGame('0xGAME_ID');

console.log(game.creator);
console.log(game.coinType);
console.log(game.stake_per_player);
console.log(game.is_private);
```

> [!NOTE]
>
> - it throws if the object response does not include decodable `content`
> - the PvP join builder uses this internally to derive the required join stake
> - after a game is joined and resolved, the live `Game` object is removed from the registry and deleted, so inspect `PvPCoinflipGameResolved` to read the final result

> [!TIP]
> Prefer this helper over manual object parsing when you only need the parsed state for a live PvP coinflip game object.

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
- `partner` configured via `suigar({ partner })` is appended automatically to metadata as the partner wallet address
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
	leftPoint: 25,
	rightPoint: 75,
	outOfRange: false,
});
```

> [!NOTE]
>
> - limbo converts `targetMultiplier` with `Math.round(targetMultiplier * scale)`
> - with the default limbo scale `100`, exposed as `DEFAULT_LIMBO_MULTIPLIER_SCALE`, a target multiplier of `2.5` becomes `250` onchain
> - range converts each point with `Math.round(value * scale)`
> - range points are bounded by the contract limit exposed as `RANGE_POINT_LIMIT`
> - with the default range scale `1_000_000`, exposed as `DEFAULT_RANGE_SCALE`, valid UI values are `0` to `100`
> - plinko and wheel `configId` must fit in `u8`

> [!TIP]
>
> - if you set `scale` to `10_000_000`, valid UI values become `0` to `10`
> - do not pre-scale range points before passing them to the SDK; pass the human value and let the SDK scale it once

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
const { object } = await client.core.getObject({
	objectId: '0xGAME_ID',
	include: { content: true },
});

if (!object.content) {
	throw new Error('Missing game content');
}

const parsed = client.suigar.bcs.PvPCoinflipGame.parse(object.content);
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
contain that partner wallet address under the `partner` entry.

> [!IMPORTANT]
>
> - execute or wait for the transaction with `include: { events: true }`
> - unwrap the core API union with `result.$kind`, `result.Transaction`, and `result.FailedTransaction`
> - parse emitted events from the unwrapped transaction result
> - use `event.bcs` for consistent decoding across transports
> - use `parseGameDetails(decoded.game_details)` instead of hand-decoding standard game detail byte arrays

> [!TIP]
>
> - `waitForTransaction({ result, include: { effects: true, events: true } })` is useful when you want the finalized transaction result before decoding
> - these helpers decode the event payload itself, not a full transaction response

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
- PvP coinflip create, join, and cancel flows through `client.suigar.tx.createPvPCoinflipTransaction(...)`, exposed in the example through a PvP coinflip action selector
- wallet connection and execution with `@mysten/dapp-kit-core` and `@mysten/dapp-kit-react`
- supported coin selection from `client.suigar.getConfig()`
- connected-wallet balance display for each supported coin in the example app
- decoding `BetResultEvent` and PvP events into a persistent event log
- parsing `BetResultEvent.game_details` with `parseGameDetails`

Run it from the repo root with:

```bash
npm --prefix examples/game-integration install
npm --prefix examples/game-integration run dev
```
