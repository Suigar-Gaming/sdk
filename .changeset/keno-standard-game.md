---
'@suigar/sdk': minor
'@suigar/mcp': minor
---

Add Keno as a standard game across the SDK and MCP. The SDK now exposes Keno game types, parameter parsing, numeric and `vector<u8>` event detail decoding, and `client.suigar.tx.createGameBet({ game: 'keno', configId, picks, ... })`; MCP adds the `build_keno_transaction` tool with read-only, build, dry-run, and execute support. Parsed `u64` and `u128` game detail values now return `bigint` to preserve integer precision.
