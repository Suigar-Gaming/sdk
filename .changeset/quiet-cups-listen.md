---
'@suigar/sdk': patch
---

Add `parseGameEvent` to `@suigar/sdk/utils` for extracting a normalized Suigar game id plus raw Move event name for supported Suigar events in `GAME_EVENTS`, including standard `BetResultEvent` and PvP coinflip events.

Change `parseGameDetails` to accept `gameId` first so TypeScript can narrow the returned detail keys and value types per game.
