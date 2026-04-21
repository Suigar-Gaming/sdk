---
name: create-pvp-games
description: Use when building or fixing AI-generated multiplayer casino flows on top of @suigar/sdk, especially PvP game creation, joins, cancellations, lobby flows, match handling, and settlement features.
---

# Create PvP Games

Use this skill for multiplayer PvP flows built on the SDK.

## Public entrypoint

PvP transactions are created through game-specific PvP transaction builders.

For PvP coinflip, use:

```ts
client.suigar.tx.createPvPCoinflipTransaction(action, options);
```

## PvP Coinflip

PvP coinflip supports these actions:

- `create`
- `join`
- `cancel`

## Create Game

Use `create` when the first player opens a new PvP coinflip match.

Required fields:

- `owner`
- `coinType`
- `stake`
- `side`

Optional fields:

- `isPrivate`
- `metadata`
- `gasBudget`
- `sender`
- `allowGasCoinShortcut`

Example:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('create', {
	owner,
	coinType: '0x2::sui::SUI',
	stake: 1_000_000_000n,
	side: 'tails',
	isPrivate: true,
});
```

Guardrails:

- Preserve the creator-selected side.
- Keep `isPrivate` explicit in product state if the UI exposes it.

## Join Game

Use `join` when a second player accepts an existing PvP match.

Required fields:

- `owner`
- `coinType`
- `gameId`
- `stake`
- `extraObjectId`

Optional fields:

- `metadata`
- `gasBudget`
- `sender`
- `allowGasCoinShortcut`

Example:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('join', {
	owner,
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME',
	stake: 1_000_000_000n,
	extraObjectId: '0xEXTRA',
});
```

Guardrails:

- The current join ABI requires both `gameId` and `extraObjectId`.
- Do not guess `extraObjectId`; treat it as a first-class input from the surrounding flow.

## Cancel Game

Use `cancel` when the creator cancels an unresolved PvP match.

Required fields:

- `owner`
- `coinType`
- `gameId`

Optional fields:

- `metadata`
- `gasBudget`
- `sender`
- `allowGasCoinShortcut`

Example:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('cancel', {
	owner,
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME',
});
```

Guardrails:

- Keep cancellation tied to the onchain `gameId`.
- Do not reuse create or join payload shapes for cancel flows.

## Critical guardrails

- Do not model PvP coinflip with `createBetTransaction`; use `createPvPCoinflipTransaction`.
- The current join ABI needs both `gameId` and `extraObjectId`.
- Preserve the caller's selected side on `create`.
- Treat lobby ids, game ids, and extra object ids as explicit product inputs.
- Keep coin type and stake semantics aligned between create and join flows unless the product enforces validation outside the SDK.

## Event decoding

Use:

- `client.suigar.bcs.PvPCoinflipGameCreated`
- `client.suigar.bcs.PvPCoinflipGameResolved`
- `client.suigar.bcs.PvPCoinflipGameCancelled`

## Implementation checklist

1. Confirm whether the feature is create, join, or cancel.
2. Wire the flow to `createPvPCoinflipTransaction`.
3. Pass the full action-specific shape, especially `extraObjectId` for joins.
4. Parse emitted PvP events with the generated BCS helpers.
5. Keep frontend or backend state aligned with onchain ids and privacy flags.
