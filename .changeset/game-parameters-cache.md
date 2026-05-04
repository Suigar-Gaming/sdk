---
'@suigar/sdk': patch
---

Add `client.suigar.getGameParameters(game, options?)` for reading live onchain game parameter objects, such as min/max stake and game-specific config bounds, directly from SweetHouse settings.

The lookup first reads the selected game's settings object from SweetHouse, then reads that game's coin-specific `Parameters<T>` object, parses it with the correct return type for the requested game, and caches the result for SDK integrations that need to display or validate current game limits without repeatedly querying the same onchain objects.

This update also broadens the public numeric helpers in `@suigar/sdk/utils`: `toBigInt()` accepts booleans and non-negative integer strings in addition to numbers and `bigint`, `toU8()` accepts plain integer strings such as `'1'` for parsed config ids and other `u8` values, and `toU16()` provides the same validation pattern for `u16` values.
