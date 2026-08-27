---
'@suigar/sdk': patch
---

Update PvP Coinflip registry lookups so `getPvPCoinflipGames()` can skip individual game resolution failures by default while still supporting `rejectOnError: true` for strict rejection.

- Document the `rejectOnError` behavior in the public JSDoc and README examples.
- Clarify repo guidance and skill documentation to distinguish general PvP game guidance from the current PvP Coinflip-specific runtime surface.
