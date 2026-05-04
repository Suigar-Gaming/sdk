---
'@suigar/sdk': patch
---

Add `client.suigar.getGameParameters(game, options?)` for reading live onchain game parameter objects, such as min/max stake and game-specific config bounds, directly from SweetHouse settings.

The lookup first reads the selected game's settings object from SweetHouse, then reads that game's coin-specific `Parameters<T>` object, parses it with the correct return type for the requested game, and caches the result for SDK integrations that need to display or validate current game limits without repeatedly querying the same onchain objects.

This update also broadens `toBigInt()` in `@suigar/sdk/utils` so it accepts non-negative integer strings in addition to numbers and `bigint`, which lets apps reuse the SDK helper when normalizing parsed onchain values.
