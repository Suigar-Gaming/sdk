---
name: installation
description: Use when setting up, scaffolding, or fixing the base @suigar/sdk installation, Sui client extension wiring, config, or serialization layer for an AI-generated casino app.
---

# Installation

Use this skill when the task is about integrating `@suigar/sdk` into an app before game-specific bet logic is added.

If the task is about installing, configuring, or operating the Suigar MCP
server or MCP App, use the `suigar-mcp` skill instead.

## Public package surface

The package currently exposes these public entrypoints:

- `@suigar/sdk`
- `@suigar/sdk/games`
- `@suigar/sdk/utils`

The package root exports:

- `suigar`
- `SuigarClient`
- `SUPPORTED_SUI_NETWORKS`
- `SuigarCoin`
- `SuigarNetwork`

Do not assume individual game builders are exported from `@suigar/sdk`.
Use the registered extension instance for runtime transaction builders.

Game-specific public types are exported from `@suigar/sdk/games`:

- `GAMES`
- `Game`
- `StandardGame`
- `PvPGame`
- `CoinSide`
- `PvPCoinflipAction`
- `BuildCoinflipTransactionOptions`
- `BuildLimboTransactionOptions`
- `BuildPlinkoTransactionOptions`
- `BuildRangeTransactionOptions`
- `BuildWheelTransactionOptions`
- `BuildCreatePvPCoinflipTransactionOptions`
- `BuildJoinPvPCoinflipTransactionOptions`
- `BuildCancelPvPCoinflipTransactionOptions`

Parser and helper utilities are exported from `@suigar/sdk/utils`:

- `fromMoveI64`
- `fromMoveFloat`
- `parseCoinType`
- `parseGameDetails`
- `parseGameEvent`
- `toBigInt`
- `toU16`
- `toU8`
- `DEFAULT_GAS_BUDGET_MIST`
- `RANGE_POINT_LIMIT`
- `DEFAULT_RANGE_SCALE`
- `DEFAULT_LIMBO_MULTIPLIER_SCALE`

Utility behavior:

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
- `fromMoveI64(value)` converts a generated Move `i64` wrapper into a JavaScript
  `number`
- `fromMoveFloat(value)` converts a generated Move float struct into a
  JavaScript `number`
- `parseCoinType(type)` extracts the normalized first generic coin type from a
  Move object type string and throws `TypeError` when no coin type can be parsed
- `parseGameDetails(gameId, gameDetails)` decodes standard `BetResultEvent.game_details`
  byte arrays into the expected string, number, and boolean values while
  preserving the original on-chain keys

Internal config and metadata helpers stay under `packages/sdk/src/helpers/*` and are not part of the intended public import surface.

## Default setup

Prefer the Sui client extension pattern:

```ts
import { SuiGrpcClient } from '@mysten/sui/grpc';
import { suigar } from '@suigar/sdk';

const client = new SuiGrpcClient({
	baseUrl: 'https://fullnode.testnet.sui.io:443',
	network: 'testnet',
}).$extend(suigar());
```

> **Important:** `partner` is a wallet address. If the app needs partner
> attribution on all supported bet flows, configure that wallet address at
> extension registration time:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ partner: '0xpartner_wallet_address' }),
);
```

> Do not pass a partner slug, label, or display name. Use the wallet address
> that should be recorded on-chain.

If the app uses a custom extension name, preserve it consistently:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ name: 'casino' }),
);
client.casino;
```

If the published SDK defaults lag behind a deployment, or if the app needs to
provide package, coin, or price object ids from environment/runtime config,
patch them through the extension config instead of forking package internals:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({
		config: {
			packageIds: {
				coinflip: '0x...',
			},
			coins: {
				sui: {
					coinType: '0x2::sui::SUI',
					decimals: 9,
				},
			},
			priceInfoObjectIds: {
				sui: '0x...',
			},
		},
	}),
);
```

## Required config guardrails

- Standard games rely on the SDK's network-resolved `priceInfoObjectIds` for supported coins.
- `client.suigar.getConfig().coins` returns the supported coin metadata keyed by `SuigarCoin`, with each entry containing `coinType` and `decimals`.
- Prefer the SDK's resolved supported coin metadata from `client.suigar.getConfig()` only for debugging, inspection, or UI coin selectors; simple examples can pass the expected coin type directly.
- Use the root-exported `SuigarCoin` and `SuigarNetwork` types when app code needs to type supported coin keys or SDK-supported networks.
- Do not invent package exports that do not exist or move runtime builders out of `client.suigar.tx`.
- Keep wallet address ownership explicit and pass the same connected account through the integration.
- If partner attribution is required, set `suigar({ partner: '<wallet-address>' })` once at extension registration time instead of passing `partner` through transaction `metadata`.

## Serialization pattern

When the app needs a wallet-ready payload:

```ts
const tx = client.suigar.tx.createBetTransaction('coinflip', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});

const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

## On-chain parameters

Use `client.suigar.getGameParameters(game, options?)` when an app needs live
on-chain game bounds or RTP parameters. The SDK first reads the selected game's
settings object from SweetHouse, then reads that game's coin-specific
`Parameters<T>` object and parses it.

If a returned parameter field is a generated Move float struct, such as
`min_target_multiplier`, `max_target_multiplier`, `min_rtp`, or `max_rtp`, run
it through `fromMoveFloat()` before using it as a normal JavaScript number.

```ts
const parameters = await client.suigar.getGameParameters('coinflip', {
	coinType: '0x2::sui::SUI',
});
```

The return type is inferred from the game id. The SDK caches the parsed
parameters for `cacheTtl`, which defaults to 30 minutes. Pass
`ignoreCache: true` to force the on-chain read to refresh and replace the cached
value.

## Event parsing

Use the extension's generated BCS helpers for emitted events:

```ts
const { gameId, eventName } = parseGameEvent(event)!;
const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(gameId, decoded.game_details);
```

Guardrails:

- Parse event payload bytes from `event.bcs` when they are available.
- Use `parseGameEvent(event)` from `@suigar/sdk/utils` when the product needs the normalized `{ gameId, eventName }` for any supported Suigar event in `GAME_EVENTS`, including standard `BetResultEvent` and PvP coinflip events.
- Use `client.suigar.bcs.BetResultEvent` for standard bet result events.
- Use `client.suigar.bcs.PvPCoinflipGameCreatedEvent`, `PvPCoinflipGameResolvedEvent`, and `PvPCoinflipGameCancelledEvent` for PvP coinflip events.
- Use the `gameId` returned by `parseGameEvent(event)` with `parseGameDetails(gameId, decoded.game_details)` from `@suigar/sdk/utils` instead of hand-decoding standard game detail byte arrays.
- Use `fromMoveFloat(decoded.unsafe_oracle_usd_coin_price)` and `fromMoveFloat(decoded.adjusted_oracle_usd_coin_price)` to display generated Move float structs.
- For object reads, parse object `content`, not `objectBcs`.

## Setup checklist

1. Install and import `@suigar/sdk`, `@mysten/sui`, and `@mysten/bcs`.
2. Extend the existing client with `suigar()`.
3. Ensure the client is connected to the intended supported network so the SDK resolves the right package ids, coin metadata, and price info object ids.
4. Keep transaction serialization inside the same registered client instance.
5. Keep the consuming app on ESM and pass the explicit `network` required by current client constructors.
