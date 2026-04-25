---
name: create-pvp-games
description: Use when building or fixing AI-generated PvP game flows on top of @suigar/sdk, especially match creation, joins, cancellations, lobby flows, match handling, and settlement features.
---

# Create PvP Games

Use this skill for PvP game flows built on the SDK.

Today, the concrete PvP runtime surface in this SDK is PvP coinflip, so the
transaction builders and runtime helpers below are coinflip-specific.

## Public entrypoint

PvP transactions are created through game-specific PvP transaction builders.

For PvP coinflip, use:

```ts
client.suigar.getPvPCoinflipGames(options?);
client.suigar.tx.createPvPCoinflipTransaction(action, options);
client.suigar.resolvePvPConflipGame(gameId);
client.suigar.bcs.PvPCoinflipGame;
```

`getPvPCoinflipGames()` lists unresolved matches by reading the PvP registry for
the active network. Joined and resolved games are removed from that registry and
their live `Game` objects are deleted. By default, individual resolution
failures are skipped so one stale registry entry does not reject the full
lookup. Pass `throwOnError: true` when the caller wants strict rejection.

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
});
```

Guardrails:

- Join derives the stake from `gameId`.
- Join uses the configured price info object id for `coinType`.
- Prefer `client.suigar.resolvePvPConflipGame(gameId)` when product logic needs the current onchain creator, normalized `coinType`, stake, or privacy state before rendering a join flow.

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
- Preserve the caller's selected side on `create`.
- Treat lobby ids and game ids as explicit product inputs.
- `metadata.partner` and `metadata.referrer` are reserved and ignored with a warning.
- If the product needs partner attribution, configure `suigar({ partner: '<wallet-address>' })` on the extension and let the SDK append that wallet address automatically.
- Treat `partner` as a wallet address, not a slug, label, or display string.

## Event decoding

Use:

- `client.suigar.getPvPCoinflipGames(options?)`
- `client.suigar.resolvePvPConflipGame(gameId)`
- `client.suigar.bcs.PvPCoinflipGame`
- `client.suigar.bcs.PvPCoinflipGameCreated`
- `client.suigar.bcs.PvPCoinflipGameResolved`
- `client.suigar.bcs.PvPCoinflipGameCancelled`

Use `getPvPCoinflipGames()` when you need the current unresolved lobby from the
registry, and use the resolver when you need the current onchain PvP coinflip game
object for a specific `gameId` and not just transaction events:

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
	throwOnError: true,
});
```

```ts
const game = await client.suigar.resolvePvPConflipGame('0xGAME');

if (game.is_private) {
	// reflect private-lobby state in the product
}
```

When a flow also decodes `BetResultEvent`, use the generated standard event helper and the SDK game-details parser:

```ts
import { parseGameDetails } from '@suigar/sdk/utils';

const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(decoded.game_details);
```

Guardrails:

- `getPvPCoinflipGames()` only returns unresolved games because registry membership is the live pending-state signal.
- `getPvPCoinflipGames()` skips per-game resolution failures by default; use `throwOnError: true` when the product should fail the whole lookup instead.
- Use `client.suigar.bcs.PvPCoinflipGame.parse(object.content)` only when you already fetched the object content yourself.
- `resolvePvPConflipGame(gameId)` is for live pending game objects; after join and resolution, inspect `PvPCoinflipGameResolved` or other emitted events instead of expecting the `Game` object to remain onchain.
- Use `event.bcs` as the event payload input when available.
- Do not route PvP coinflip transaction creation through standard bet builders.
- Do not hand-decode `BetResultEvent.game_details`; use `parseGameDetails`, which understands `pvp_result` along with standard game keys.

## Implementation checklist

1. Confirm whether the feature is create, join, or cancel.
2. Wire the flow to `createPvPCoinflipTransaction`.
3. For join or cancel, pass `gameId` and provide the transaction `coinType`.
4. If the product needs the unresolved lobby, read it with `client.suigar.getPvPCoinflipGames()`. If it needs a specific live match state, resolve it with `client.suigar.resolvePvPConflipGame(gameId)`.
5. Parse emitted PvP events with the generated BCS helpers.
6. Parse `BetResultEvent.game_details` with `parseGameDetails` when displaying bet result details.
7. Keep frontend or backend state aligned with onchain ids and privacy flags.
