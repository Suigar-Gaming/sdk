---
name: create-pvp-games
description: Use when building or fixing AI-generated PvP game flows on top of @suigar/sdk, especially match creation, joins, cancellations, lobby flows, match handling, and settlement features.
---

# Create PvP Games

Use this skill for PvP game flows built on the SDK.

If the user is working through `@suigar/mcp` tools instead of application code
that imports `@suigar/sdk`, use the `suigar-mcp` skill. The MCP PvP create
tool uses the input name `creatorSide`, which maps to the SDK `side` option.

Today, the concrete PvP runtime surface in this SDK is PvP coinflip, so the
transaction builders and runtime helpers below are coinflip-specific.

## Public entrypoint

PvP transactions are created through game-specific PvP transaction builders.

For PvP coinflip, use:

```ts
client.suigar.getPvPCoinflipGames(options?);
client.suigar.tx.createPvPCoinflipTransaction(action, options);
client.suigar.bcs.PvPCoinflipGame;
```

`getPvPCoinflipGames()` lists unresolved matches by reading the PvP registry for
the active network, then bulk-loading the referenced game objects with
`client.core.getObjects()`. Joined and resolved games are removed from that
registry and their live `Game` objects are deleted. By default, per-object
fetch or parse failures are skipped so one stale registry entry does not reject the full
lookup. Pass `throwOnError: true` when the caller wants strict rejection. Any
supported `listDynamicFields()` options such as `limit`, `cursor`, or `signal`
can be forwarded through `options`.

## PvP Coinflip

PvP coinflip supports these actions:

- `create`
- `join`
- `cancel`

When app code needs typed PvP action values, import `PvPCoinflipAction` from
`@suigar/sdk/games` instead of redefining the action union. Use `PvPGame` from
the same subpath when typing supported PvP game ids.

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
- `useGasCoin` only when overriding Mysten's default coin intent behavior

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
- Let the SDK build the stake coin from `coinType` and `stake` with Mysten
  `coinWithBalance` transaction arguments; do not preselect or split coin
  objects in application code. Set `useGasCoin` only when the app needs to
  override Mysten's default coin intent behavior.

## Join Game

Use `join` when a second player accepts an existing PvP match.

Required fields:

- `owner`
- `coinType`
- `gameId`

Optional fields:

- `metadata`
- `gasBudget`
- `useGasCoin` only when overriding Mysten's default coin intent behavior

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
- Let the SDK fetch the on-chain stake and build the join coin input from the
  owner's balance.
- Do not pass custom bet coin callbacks or manually call `tx.add()` for join;
  the SDK resolves the on-chain stake and supplies the transaction argument.
- Prefer `client.suigar.getPvPCoinflipGames(options?)` when product logic needs current lobby state before rendering join cards. For one specific live game object, use `client.suigar.bcs.PvPCoinflipGame.get({ client, objectId: gameId })`.

## Cancel Game

Use `cancel` when the creator cancels an unresolved PvP match.

Required fields:

- `owner`
- `coinType`
- `gameId`

Optional fields:

- `metadata`
- `gasBudget`
- `useGasCoin` only when overriding Mysten's default coin intent behavior

Example:

```ts
const tx = client.suigar.tx.createPvPCoinflipTransaction('cancel', {
	owner,
	coinType: '0x2::sui::SUI',
	gameId: '0xGAME',
});
```

Guardrails:

- Keep cancellation tied to the on-chain `gameId`.
- Do not reuse create or join payload shapes for cancel flows.

## Critical guardrails

- Do not model PvP coinflip with `createBetTransaction`; use `createPvPCoinflipTransaction`.
- Preserve the caller's selected side on `create`.
- Treat lobby ids and game ids as explicit product inputs.
- `metadata.partner` and `metadata.referrer` are reserved and ignored with a warning.
- If the product needs partner attribution, configure `suigar({ partner: '<wallet-address>' })` on the extension and let the SDK prepend that wallet address automatically.
- Treat `partner` as a wallet address, not a slug, label, or display string.
- Use `client.suigar.getConfig().coins` when the UI needs supported coin
  `coinType` and `decimals`; use the root-exported `SuigarCoin` type for
  supported coin keys.

## Event decoding

Use:

- `client.suigar.getPvPCoinflipGames(options?)`
- `client.suigar.bcs.PvPCoinflipGame`
- `client.suigar.bcs.PvPCoinflipGameCreatedEvent`
- `client.suigar.bcs.PvPCoinflipGameResolvedEvent`
- `client.suigar.bcs.PvPCoinflipGameCancelledEvent`
- `parseGameEvent(event)` from `@suigar/sdk/utils` when the product needs the normalized `{ gameId, eventName }` for a raw Suigar event

Use `getPvPCoinflipGames()` when you need the current unresolved lobby from the
registry. Use the generated `PvPCoinflipGame` helper when you need the current
on-chain PvP coinflip game object for a specific `gameId` and not just
transaction events:

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

```ts
const game = await client.suigar.bcs.PvPCoinflipGame.get({
	client,
	objectId: '0xGAME',
});

if (game.json.is_private) {
	// reflect private-lobby state in the product
}
```

```ts
const controller = new AbortController();

const game = await client.suigar.bcs.PvPCoinflipGame.get({
	client,
	objectId: '0xGAME',
	signal: controller.signal,
});
```

When a flow also decodes `BetResultEvent`, use the generated standard event helper and the SDK game-details parser:

```ts
import { parseGameDetails, parseGameEvent } from '@suigar/sdk/utils';

const { gameId, eventName } = parseGameEvent(event)!;
const decoded = client.suigar.bcs.BetResultEvent.parse(event.bcs);
const gameDetails = parseGameDetails(gameId, decoded.game_details);
```

Guardrails:

- `getPvPCoinflipGames()` only returns unresolved games because registry membership is the live pending-state signal.
- `getPvPCoinflipGames()` skips per-object fetch or parse failures by default; use `throwOnError: true` when the product should fail the whole lookup instead.
- Use `client.suigar.bcs.PvPCoinflipGame.get({ client, objectId })` when you need one specific live pending game object; it forwards supported object lookup options such as `signal`.
- Use `client.suigar.bcs.PvPCoinflipGame.parse(object.content)` only when you already fetched the object content yourself.
- After join and resolution, inspect `PvPCoinflipGameResolvedEvent` or other emitted events instead of expecting the `Game` object to remain on-chain.
- Use `event.bcs` as the event payload input when available.
- Do not route PvP coinflip transaction creation through standard bet builders.
- Do not hand-decode `BetResultEvent.game_details`; use `parseGameEvent(event)` to retrieve `gameId`, then `parseGameDetails(gameId, ...)`, which understands `pvp_result` along with standard game keys.

## Implementation checklist

1. Confirm whether the feature is create, join, or cancel.
2. Wire the flow to `createPvPCoinflipTransaction`.
3. For join or cancel, pass `gameId` and provide the transaction `coinType`.
4. If the product needs the unresolved lobby, read it with `client.suigar.getPvPCoinflipGames()`. If it needs a specific live match state, fetch it with `client.suigar.bcs.PvPCoinflipGame.get({ client, objectId: gameId })`.
5. Parse emitted PvP events with the generated BCS helpers.
6. Parse `BetResultEvent.game_details` with `parseGameDetails` when displaying bet result details.
7. Keep frontend or backend state aligned with on-chain ids and privacy flags.
