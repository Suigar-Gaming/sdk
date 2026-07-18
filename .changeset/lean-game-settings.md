---
'@suigar/sdk': minor
---

Load game parameters with fewer network calls by retrieving the game settings field ID without fetching its object. Export `isMoveFloat` and `isMoveI64` from `@suigar/sdk/utils`, and return Move float parameter fields as JavaScript numbers, including multipliers nested in game configs.
