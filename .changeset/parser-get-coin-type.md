---
'@suigar/sdk': patch
---

Remove the `client.suigar.resolvePvPConflipGame()` client method. Use the exported generated helper `client.suigar.bcs.PvPCoinflipGame.get({ client, objectId })` for one specific live PvP coinflip game object instead.

Add `parseCoinType` to `@suigar/sdk/utils` for extracting normalized coin types from generic Move object type strings.
