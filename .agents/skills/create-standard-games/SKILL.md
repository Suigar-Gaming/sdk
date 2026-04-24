---
name: create-standard-games
description: Use when building, scaffolding, or fixing AI-generated standard casino game flows on top of @suigar/sdk, especially coinflip, limbo, plinko, range, or wheel bet transactions.
---

# Create Standard Games

Use this skill for standard single-player game transactions.

## Standard game workflow

Always prefer:

```ts
client.suigar.tx.createBetTransaction(gameId, options);
```

Supported game ids:

- `coinflip`
- `limbo`
- `plinko`
- `range`
- `wheel`

## Shared options

- `owner: string`
- `coinType: string`
- `stake: number | bigint`
- `cashStake?: number | bigint`
- `betCount?: number | bigint`
- `metadata?: Record<string, string | number | boolean | bigint | Uint8Array | number[] | null | undefined>`
- `gasBudget?: number | bigint`
- `sender?: string`
- `allowGasCoinShortcut?: boolean`

Extension-level option:

- `suigar({ partner?: string })` appends the partner wallet address to `partner` metadata automatically across all supported bet flows.

## Game-specific options

- `coinflip`: `side: 'heads' | 'tails'`
- `limbo`: `targetMultiplier: number`, optional `scale`
- `plinko`: `configId: number`
- `range`: `leftPoint: number`, `rightPoint: number`, optional `outOfRange`, optional `scale`
- `wheel`: `configId: number`

## Coinflip

Use `coinflip` when the player chooses a side explicitly.

Required addition:

- `side: 'heads' | 'tails'`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('coinflip', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'heads',
});
```

Guardrails:

- Preserve the UI-selected side exactly.
- Do not remap display labels to unsupported values.

## Limbo

Use `limbo` when the player bets against a target multiplier.

Required addition:

- `targetMultiplier: number`

Optional addition:

- `scale?: number`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('limbo', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	targetMultiplier: 2.5,
});
```

Guardrails:

- `targetMultiplier` is converted by the SDK using the configured or default scale.
- Keep UI decimal inputs as numbers until the SDK converts them.

## Plinko

Use `plinko` when the game flow depends on a predefined board configuration.

Required addition:

- `configId: number`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('plinko', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	configId: 3,
});
```

Guardrails:

- `configId` must match a valid onchain configuration.
- Do not derive or randomize `configId` silently.

## Range

Use `range` when the player chooses a bounded interval and optional in-range or out-of-range behavior.

Required additions:

- `leftPoint: number`
- `rightPoint: number`

Optional additions:

- `outOfRange?: boolean`
- `scale?: number`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('range', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	leftPoint: 25,
	rightPoint: 75,
	outOfRange: false,
});
```

Guardrails:

- Keep `leftPoint` and `rightPoint` ordered before building the transaction.
- Do not pre-scale range points in app code; pass human values and let the SDK apply the selected scale once.
- Range points must stay within the contract cap after scaling. With the default scale `1_000_000`, valid UI values are `0` to `100`.
- Let the SDK convert fixed-point values using the selected scale.

## Wheel

Use `wheel` when the game depends on a predefined wheel configuration.

Required addition:

- `configId: number`

Example:

```ts
const tx = client.suigar.tx.createBetTransaction('wheel', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	configId: 1,
});
```

Guardrails:

- `configId` must match a valid wheel setup.
- Keep frontend labels and backend configuration ids in sync.

## Guardrails for casino apps

- Treat `stake` as the logical wager passed to Move.
- Use `cashStake` only when the withdrawn coin amount must differ from the game stake.
- `betCount` defaults to `1`; do not reimplement batching unless the product requires custom behavior.
- Pass plain application values in `metadata`; let the SDK encode them.
- Do not set `metadata.partner` or `metadata.referrer`; those keys are reserved and the SDK ignores them with a warning.
- If the product needs partner attribution, configure `suigar({ partner: '<wallet-address>' })` once on the client extension instead of passing it per transaction.
- Treat `partner` as a wallet address, not a slug, label, or display string.
- Keep amounts as `bigint` once they leave the UI layer.
- Ensure the same connected wallet address is used as `owner`.

## Event decoding

Use the generated BCS event decoder for standard bet results:

```ts
import { parseFloat, parseGameDetails } from '@suigar/sdk/utils';

const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(decoded.game_details);
const adjustedOraclePrice = parseFloat(decoded.adjusted_oracle_usd_coin_price);
```

Guardrails:

- Use `event.bcs` as the event payload input when available.
- Do not hand-decode `game_details` byte arrays in app code; use `parseGameDetails`.
- `parseGameDetails` preserves the onchain keys and returns decoded string, number, and boolean values.
- Metadata remains generic `VecMap<string, vector<u8>>` data; decode it according to the app's own metadata contract.

## Implementation checklist

1. Confirm the target standard game id.
2. Verify the base client already has the `suigar()` extension configured.
3. Build the transaction with `createBetTransaction`.
4. Serialize only if the surrounding wallet or transport path needs bytes.
5. Decode `BetResultEvent` with `client.suigar.bcs.BetResultEvent` and `parseGameDetails`.
6. Keep frontend forms, backend handlers, and event decoding aligned with the same game-specific option shape.
