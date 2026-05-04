---
'@suigar/sdk': patch
---

Add `client.suigar.getGameParameters(game, options?)` for reading live onchain game parameter objects, such as min/max stake and game-specific config bounds, directly from SweetHouse settings.

The lookup resolves the settings object for the selected game and coin type, parses the generated `Parameters<T>` object with the correct return type for the requested game, and caches the result for SDK integrations that need to display or validate current game limits without repeatedly querying the same onchain objects.
