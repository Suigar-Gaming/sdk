---
name: installation
description: Use when setting up, scaffolding, or fixing the base @suigar/sdk installation, Sui client extension wiring, config, or serialization layer for an AI-generated casino app.
---

# Installation

Use this skill when the task is about integrating `@suigar/sdk` into an app before game-specific bet logic is added.

## Public package surface

The package currently exposes these public entrypoints:

- `@suigar/sdk`
- `@suigar/sdk/games`
- `@suigar/sdk/utils`

The package root exports:

- `suigar`
- `SuigarClient`

Do not assume individual game builders are exported from `@suigar/sdk`.
Use the registered extension instance for runtime transaction builders.

Game-specific public types are exported from `@suigar/sdk/games`:

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
- `parseGameDetails`
- `toBigInt`
- `toU8`
- `DEFAULT_GAS_BUDGET_MIST`
- `RANGE_POINT_LIMIT`
- `DEFAULT_RANGE_SCALE`
- `DEFAULT_LIMBO_MULTIPLIER_SCALE`

Internal config and metadata helpers stay under `src/helpers/*` and are not part of the intended public import surface.

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
> that should be recorded onchain.

If the app uses a custom extension name, preserve it consistently:

```ts
const client = new SuiGrpcClient({ baseUrl, network }).$extend(
	suigar({ name: 'casino' }),
);
client.casino;
```

## Required config guardrails

- Standard games rely on the SDK's network-resolved `priceInfoObjectIds` for supported coins.
- Prefer the SDK's resolved supported coin types from `client.suigar.getConfig()` only for debugging or inspection; normal examples can pass the expected coin type directly.
- Do not invent package exports that do not exist or move runtime builders out of `client.suigar.tx`.
- Keep wallet address ownership explicit and pass the same connected account through the integration.
- If partner attribution is required, set `suigar({ partner: '<wallet-address>' })` once at extension registration time instead of passing `partner` through transaction `metadata`.

## Serialization pattern

When the app needs a wallet-ready payload:

```ts
const tx = client.suigar.tx.createBetTransaction('coinflip', {
	playerAddress,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});

const base64 = await client.suigar.serializeTransactionToBase64(tx);
```

## Event parsing

Use the extension's generated BCS helpers for emitted events:

```ts
const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
```

Guardrails:

- Parse event payload bytes from `event.bcs` when they are available.
- Use `client.suigar.bcs.BetResultEvent` for standard bet result events.
- Use `client.suigar.bcs.PvPCoinflipGameCreatedEvent`, `PvPCoinflipGameResolvedEvent`, and `PvPCoinflipGameCancelledEvent` for PvP coinflip events.
- Use `parseGameDetails(decoded.game_details)` from `@suigar/sdk/utils` instead of hand-decoding standard game detail byte arrays.
- Use `fromMoveFloat(decoded.unsafe_oracle_usd_coin_price)` and `fromMoveFloat(decoded.adjusted_oracle_usd_coin_price)` to display generated Move float structs.
- For object reads, parse object `content`, not `objectBcs`.

## Setup checklist

1. Install and import `@suigar/sdk`, `@mysten/sui`, and `@mysten/bcs`.
2. Extend the existing client with `suigar()`.
3. Ensure the client is connected to the intended supported network so the SDK resolves the right package ids, coin types, and price info object ids.
4. Keep transaction serialization inside the same registered client instance.
5. Keep the consuming app on ESM and pass the explicit `network` required by current client constructors.
