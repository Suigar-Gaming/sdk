---
'@suigar/sdk': patch
---

Update PvP coinflip lookup helpers to use bulk object reads for unresolved lobby discovery and support forwarded lookup options.

- Make `getPvPCoinflipGames()` parse bulk `client.core.getObjects()` results instead of resolving each game individually.
- Skip per-object fetch or parse failures by default and continue supporting strict rejection with `throwOnError: true`.
- Forward supported lookup options such as `signal` through `getPvPCoinflipGames()` and `resolvePvPConflipGame(gameId, options?)`.
- Update tests, README guidance, and repo-local PvP skill documentation to match the current client behavior.
