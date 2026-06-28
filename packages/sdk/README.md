# `@suigar/sdk`

TypeScript SDK for building Suigar v2 game transactions on Sui.

## Installation

```bash
npm install --save @suigar/sdk @mysten/sui @mysten/bcs
```

Runtime requirements:

- Node.js `^22.18.0 || >=24.0.0`
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
	fromMoveFloat,
	fromMoveI64,
	parseCoinType,
	parseGameDetails,
	RANGE_POINT_LIMIT,
	toBigInt,
	toU8,
	toU16,
} from '@suigar/sdk/utils';
```

Numeric helper behavior:

- `toBigInt(value)` accepts `bigint`, finite `number`, non-negative integer
  `string`, and `boolean` inputs and returns a normalized non-negative `bigint`
  while throwing `TypeError` for invalid input shapes and `RangeError` for
  negative values
- `toU8(value)` accepts a finite integer `number` or plain integer `string` in
  the inclusive `0..255` range, throwing `TypeError` for non-numeric input and
  `RangeError` for booleans, fractional values, or out-of-range integers
- `toU16(value)` accepts a finite integer `number` or plain integer `string`
  in the inclusive `0..65535` range, throwing `TypeError` for non-numeric
  input and `RangeError` for booleans, fractional values, or out-of-range
  integers
- `fromMoveI64(value)` converts a generated Move `i64` wrapper into a
  JavaScript `number`
- `fromMoveFloat(value)` converts a generated Move float struct into a
  JavaScript `number`
- `parseCoinType(type)` extracts the normalized first generic coin type from a
  Move object type string and throws `TypeError` when no coin type can be parsed
- `parseGameDetails(gameId, gameDetails)` decodes standard `BetResultEvent.game_details`
  byte arrays into the expected string, number, and boolean values while
  preserving the original on-chain keys

Game-specific type exports are available from the dedicated `games` subpath:

```ts
import type {
	BuildCoinflipTransactionOptions,
	BuildCreatePvPCoinflipTransactionOptions,
	CoinSide,
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

The extension constructor throws `RangeError` when the connected client network
is not one of the SDK's supported Sui networks.

### Partner Setup

> **Important:** `partner` is the partner wallet address. Configure it once
> when you register the extension so the SDK can prepend that wallet address to
> supported bet metadata automatically.

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ partner: '0xpartner_wallet_address' }),
);

client.suigar;
```

Do not pass a partner slug, label, or display name here. Use the wallet
address that should receive partner attribution on-chain.

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
- internal supported coin metadata by network
- internal price info object ids by network
- the connected client network
- the extension name

Supported override areas:

- `name`
- `partner`
- `cacheTtl`
- `config.packageIds`
- `config.registryIds`
- `config.coins`
- `config.priceInfoObjectIds`

Use `config` when the application needs to patch package ids, supported
`sui`/`usdc` coin metadata, or price info object ids before a new SDK release is
published.

```ts
const client = new SuiGrpcClient({ network, baseUrl }).$extend(
	suigar({
		config: {
			coins: {
				usdc: {
					coinType: '0xPACKAGE::usdc::USDC',
					decimals: 6,
				},
			},
			priceInfoObjectIds: {
				usdc: '0xPYTH_PRICE_INFO',
			},
		},
	}),
);
```

If `partner` is configured, the SDK automatically writes that partner wallet
address into the on-chain metadata vec-map. Transaction builder options may also
include `metadata`, but reserved keys such as `partner` and `referrer` are
ignored with a warning when provided manually.

`cacheTtl` controls the SDK cache for on-chain reads such as parsed game
parameters. It is expressed in milliseconds and defaults to 30 minutes.

## Runtime Surface

The registered extension instance exposes the main runtime surface:

- `getConfig()`
- `getGameParameters(game, options?)`
- `serializeTransactionToBase64(transaction, options?)`
- `getPvPCoinflipGames(options?)`
- `bcs`
- `tx`

### `getConfig()`

Returns the resolved SDK configuration for the connected network.

This is intended mainly for debugging and inspection, for example to verify the
resolved package ids or supported coin metadata for the active client network.

It includes:

- `packageIds`
- `registryIds`
- `coins`
- `priceInfoObjectIds`

```ts
const config = client.suigar.getConfig();
console.log(config.packageIds);
console.log(config.coins.sui.coinType);
```

### `getGameParameters(game, options?)`

Returns the on-chain `Parameters<T>` object for any supported game and coin type.
The return type is inferred from `game`.

The SDK first reads the selected game's settings object from the configured
SweetHouse object, then reads that game's coin-specific `Parameters<T>` object.
This is useful for displaying or validating current limits such as min/max
stake, house edge, or game-specific config bounds. The parsed result is cached
using the extension `cacheTtl`.

When a parameter field is a generated Move float struct, such as
`min_target_multiplier`, `max_target_multiplier`, `min_rtp`, or `max_rtp`, use
`fromMoveFloat()` before treating it as a normal JavaScript number.

```ts
const parameters = await client.suigar.getGameParameters('coinflip', {
	coinType: '0x2::sui::SUI',
});

console.log(parameters.min_stake);
```

Pass `ignoreCache: true` to refresh the on-chain read and replace the cached
value.

### `serializeTransactionToBase64(transaction, options?)`

Builds a transaction with the configured Sui client and returns base64-encoded transaction bytes.

Use this when you need a transport-safe payload for a wallet, API, or external signer.

```ts
const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

### `getPvPCoinflipGames(options?)`

Lists unresolved PvP coinflip games from the configured PvP registry.

This reads the registry dynamic fields for the active network and resolves each
entry into parsed game state through a bulk `client.core.getObjects()` lookup.
Registry membership is the unresolved-state signal: once a match is joined and
resolved, the Move flow removes it from the registry and deletes the live
`Game` object.

Use this when a product needs the current set of open PvP coinflip matches for
browsing or lobby views.

By default, per-object fetch or parse failures are skipped so one broken or
already-deleted registry entry does not reject the full lookup. Pass
`throwOnError: true` if you want the call to reject instead.

Each returned entry includes the parsed game fields plus a derived
`coin_type` string from the underlying Move object type.

Any supported `listDynamicFields()` options such as `limit`, `cursor`, or
`signal` can be passed through `options`.

```ts
const games = await client.suigar.getPvPCoinflipGames({ limit: 20 });

for (const game of games) {
	console.log(game.id);
	console.log(game.coin_type);
}
```

```ts
const games = await client.suigar.getPvPCoinflipGames({
	limit: 20,
	throwOnError: true,
});
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
- `useGasCoin?: boolean`

Shared behavior:

- `stake` is the logical stake passed into the Move call
- `cashStake` controls the withdrawn balance and defaults to `stake`
- `betCount` defaults to `1`
- `metadata` is encoded into `keys` and `values` byte arrays
- `partner` configured via `suigar({ partner })` is prepended automatically to metadata as the partner wallet address
- `metadata.partner` and `metadata.referrer` are reserved and ignored with a warning
- the SDK resolves the price info object from the configured supported-coin mapping
- the reward object is transferred back to `owner`

Error behavior:

- `RangeError` when `gameId` is unsupported
- `RangeError` when `coinType` is not in the resolved supported-coin config for the active network
- `RangeError` from bounded numeric helpers such as `toU8()` when `plinko` or `wheel` `configId` is out of range or not an integer

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

> **Note:**
>
> - limbo converts `targetMultiplier` with `Math.round(targetMultiplier * scale)`
> - with the default limbo scale `100`, exposed as `DEFAULT_LIMBO_MULTIPLIER_SCALE`, a target multiplier of `2.5` becomes `250` on-chain
> - range converts each point with `Math.round(value * scale)`
> - range points are bounded by the contract limit exposed as `RANGE_POINT_LIMIT`
> - with the default range scale `1_000_000`, exposed as `DEFAULT_RANGE_SCALE`, valid UI values are `0` to `100`
> - plinko and wheel `configId` must fit in `u8`

> **Tip:**
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
- `useGasCoin?: boolean`

Action-specific options:

- `create`: `stake`, `side`, `isPrivate?`
- `join`: `gameId`
- `cancel`: `gameId`

Error behavior:

- `RangeError` when `action` is unsupported
- `RangeError` when `coinType` is not in the resolved supported-coin config for the active network

## `bcs`

BCS helpers live under `client.suigar.bcs`.

Current exposed helpers:

- `PvPCoinflipGame`
- `BetResultEvent`
- `PvPCoinflipGameCreatedEvent`
- `PvPCoinflipGameResolvedEvent`
- `PvPCoinflipGameCancelledEvent`

These are generated Move event decoders. Use them to parse Suigar event payloads from transaction results. The `@suigar/sdk/utils` subpath also exposes parser helpers for generated BCS values:

- `PvPCoinflipGame` parses a PvP coinflip game object's `content`
- `fromMoveI64(float.exp)` converts a generated Move `i64` exponent to a JavaScript number
- `fromMoveFloat(float)` converts a generated Move `Float` struct to a JavaScript number
- `parseCoinType(type)` extracts the normalized coin type from generic Move object type strings such as PvP coinflip `Game<T>`
  and throws `TypeError` when the type string does not include a first generic coin type
- `parseGameDetails(gameId, game_details)` decodes `BetResultEvent.game_details` entries into the expected string, number, and boolean values

### Parse PvP Coinflip Game Object Data

Use the generated BCS helper when you want to fetch and parse a game object:

```ts
const game = await client.suigar.bcs.PvPCoinflipGame.get({
	client,
	objectId: '0xGAME_ID',
});

console.log(game.json);
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

`game_details` and `metadata` decode as `VecMap<string, vector<u8>>`-shaped data, so values come back as byte arrays. Use `parseGameEvent(event)` from `@suigar/sdk/utils` to retrieve the normalized `gameId` and `eventName`, then pass that `gameId` to `parseGameDetails(gameId, decoded.game_details)` for game-specific key and value typing.

```ts
import { parseGameDetails, parseGameEvent } from '@suigar/sdk/utils';

const { gameId, eventName } = parseGameEvent(event)!;
const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(gameId, decoded.game_details);
```

`parseGameDetails` preserves the on-chain keys and only changes the value representation. For example, coinflip details keep keys such as `player_bet` and `coin_outcome`; range details keep keys such as `roll_value`, `win`, and `payout_multiplier`.

`parseGameDetails(gameId, decoded.game_details)` narrows based on the parsed event game id. For example, when `gameId === 'coinflip'` it narrows to:

- `{ player_bet: string; coin_outcome: string }`

`parseGameEvent(event)` returns the normalized game id and raw Move event name for every supported Suigar event in `GAME_EVENTS`:

- `{ gameId: 'coinflip' | 'limbo' | 'plinko' | 'range' | 'wheel', eventName: 'BetResultEvent' }` for standard bet result events
- `{ gameId: 'pvp-coinflip', eventName: 'GameCreatedEvent' | 'GameResolvedEvent' | 'GameCancelledEvent' }` for PvP coinflip events
- `null` for unsupported event names or non-Suigar event payloads

When the extension is configured with `partner`, decoded event `metadata` will
contain that partner wallet address under the `partner` entry.

> **Important:**
>
> - execute or wait for the transaction with `include: { events: true }`
> - unwrap the core API union with `result.$kind`, `result.Transaction`, and `result.FailedTransaction`
> - parse emitted events from the unwrapped transaction result
> - use `event.bcs` for consistent decoding across transports
> - use `const { gameId } = parseGameEvent(event)!` and then `parseGameDetails(gameId, decoded.game_details)` instead of hand-decoding standard game detail byte arrays

> **Tip:**
>
> - `waitForTransaction({ result, include: { effects: true, events: true } })` is useful when you want the finalized transaction result before decoding
> - these helpers decode the event payload itself, not a full transaction response

### Parse PvP Coinflip Event Data

Use the matching helper for each PvP coinflip event payload found in `transactionResult.events`:

- `client.suigar.bcs.PvPCoinflipGameCreatedEvent`
- `client.suigar.bcs.PvPCoinflipGameResolvedEvent`
- `client.suigar.bcs.PvPCoinflipGameCancelledEvent`

## Development

```bash
pnpm --dir packages/sdk build
pnpm --dir packages/sdk typecheck
pnpm --dir packages/sdk test
```

## Example App

This repository includes a Next.js integration playground in [playground](../../playground).

It demonstrates:

- standard game transactions through `client.suigar.tx.createBetTransaction(...)`
- PvP coinflip create, join, and cancel flows through `client.suigar.tx.createPvPCoinflipTransaction(...)`, exposed in the example through a PvP coinflip action selector
- unresolved PvP lobby browsing through `client.suigar.getPvPCoinflipGames(...)`, including public join cards while disconnected, an optional private-lobby join toggle, and connected-wallet filtering for cancel
- wallet connection and execution with `@mysten/dapp-kit-core` and `@mysten/dapp-kit-react`
- supported coin selection from `client.suigar.getConfig()`
- connected-wallet balance display for each supported coin in the example app
- privacy badges and copyable PvP game ids in the lobby UI
- decoding `BetResultEvent` and PvP events into a persistent event log
- parsing `BetResultEvent.game_details` with `parseGameDetails`

Run it from the repo root with:

```bash
pnpm install
pnpm turbo run dev --filter='./playground'
```
