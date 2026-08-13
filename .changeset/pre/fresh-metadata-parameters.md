---
'@suigar/mcp': patch
---

Expose `read_config` and `read_game_metadata` as standalone read-only MCP tools. `read_game_metadata` now requires one supported game and returns its live, cache-controllable on-chain parameters through `client.suigar.getGameParameters()`, including SDK-normalized float values and formatted atomic amount limits. MCP App support remains focused on transaction tools.
