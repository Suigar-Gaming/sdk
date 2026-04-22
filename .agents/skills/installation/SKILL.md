---
name: installation
description: Use when setting up, scaffolding, or fixing the base @suigar/sdk installation, Sui client extension wiring, config, or serialization layer for an AI-generated casino app.
---

# Installation

Use this skill when the task is about integrating `@suigar/sdk` into an app before game-specific bet logic is added.

## Public package surface

The package root currently exports:

- `suigar`

Do not assume individual game builders are exported from `@suigar/sdk`.

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
- Do not invent package-root exports that do not exist.
- Keep wallet address ownership explicit and pass the same connected account through the integration.

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

## Event parsing

Use the extension's generated BCS helpers and parse object `content`, not `objectBcs`.

## Setup checklist

1. Install and import `@suigar/sdk`, `@mysten/sui`, and `@mysten/bcs`.
2. Extend the existing client with `suigar()`.
3. Ensure the client is connected to the intended supported network so the SDK resolves the right package ids, coin types, and price info object ids.
4. Keep transaction serialization inside the same registered client instance.
5. Keep the consuming app on ESM and pass the explicit `network` required by current client constructors.
