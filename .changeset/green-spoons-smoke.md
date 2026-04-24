---
'@suigar/sdk': patch
---

Add `registryIds` to `SuigarConfig` and resolve it from the network config registry map.

Document the PvP coinflip runtime helpers more clearly by describing
registry-backed unresolved game discovery through `getPvPCoinflipGames()` and
the normalized live-game lookup behavior of `resolvePvPConflipGame()`.
