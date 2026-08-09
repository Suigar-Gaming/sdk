---
'@suigar/mcp': minor
---

Add named local session wallet support across MCP wallet, balance, coin, and execute-mode game tools, including wallet IDs in session-wallet setup, lookup, funding, and transaction execution flows.

Start paired-wallet login and logout from MCP tools through the local `npx -y @suigar/mcp` CLI flows so browser-mediated wallet pairing opens the selected network automatically.

Update MCP package metadata and remove the static CLI tool catalog in favor of MCP protocol tool discovery.
