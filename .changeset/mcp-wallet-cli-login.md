---
'@suigar/mcp': minor
---

Add named local session wallet support across MCP wallet, balance, coin, and execute-mode game tools, including wallet IDs in session-wallet setup, lookup, funding, and transaction execution flows.

Start paired-wallet login and logout from MCP tools through the local `npx -y @suigar/mcp` CLI flows so browser-mediated wallet pairing opens the selected network automatically.

Make local browser bridge timeout and callback body-size limits configurable with `SUIGAR_MCP_BRIDGE_TIMEOUT_MS`, `SUIGAR_MCP_BRIDGE_MAX_BODY_BYTES`, `--bridge-timeout-ms`, and `--max-body-bytes`, and have bridge creation open its URL by default unless disabled.

Update MCP package metadata and remove the static CLI tool catalog in favor of MCP protocol tool discovery.
