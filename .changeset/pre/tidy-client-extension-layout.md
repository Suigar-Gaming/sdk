---
'@suigar/sdk': major
'@suigar/mcp': major
---

Reorganize the client extension transaction API. Rename `client.suigar.tx.createBetTransaction(game, options)` to `client.suigar.tx.createGameBet(game, options)`, and replace `createPvPCoinflipTransaction(action, options)` with action-specific `client.suigar.tx.pvpCoinflip.createGame(options)`, `.joinGame(options)`, and `.cancelGame(options)` builders. Rename public transaction option types to reflect their game or action inputs, including `CreateGameBetOptions`, `RangeTransactionOptions`, and the PvP coinflip transaction option types.
