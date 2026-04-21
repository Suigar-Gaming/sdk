---
name: installation
description: Use when setting up, scaffolding, or fixing the base @suigar/sdk installation, Sui client extension wiring, config, or serialization layer for an AI-generated casino app.
---

# Installation

Use this skill when the task is about integrating `@suigar/sdk` into an app before game-specific bet logic is added.

## Public package surface

The package root currently exports:

- `suigar`
- `SuigarClient`

Do not assume individual game builders are exported from `@suigar/sdk`.

## Default setup

Prefer the Sui client extension pattern:

```ts
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { suigar } from '@suigar/sdk';

const client = new SuiClient({
	url: getFullnodeUrl('testnet'),
}).$extend(
	suigar({
		pyth: {
			suiPriceInfoObjectId: '0xPYTH_SUI_PRICE_INFO',
			usdcPriceInfoObjectId: '0xPYTH_USDC_PRICE_INFO',
		},
	}),
);
```

If the app uses a custom extension name, preserve it consistently:

```ts
const client = new SuiClient({ url }).$extend(suigar({ name: 'casino' }));
client.casino;
```

## Required config guardrails

- Standard games require Pyth price object ids for supported coin types.
- Keep coin type configuration explicit if the product supports more than default SUI and USDC mappings.
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

1. Install and import `@suigar/sdk`.
2. Extend the existing `SuiClient` with `suigar()`.
3. Add Pyth price object config for every supported betting coin.
4. Keep transaction serialization inside the same registered client instance.
