---
'@suigar/mcp': minor
---

Add named local session wallet support across MCP wallet, balance, coin, and execute-mode game tools, including wallet IDs in session-wallet setup, lookup, funding, and transaction execution flows.

Start paired-wallet login and logout from MCP tools through the local `npx -y @suigar/mcp` CLI flows so browser-mediated wallet pairing opens the selected network automatically.

Make local browser origins, bridge timeout, callback body-size limits, and session-wallet setup expiration configurable with `SUIGAR_MCP_BRIDGE_WEB_URL`, `SUIGAR_MCP_BRIDGE_TIMEOUT_MS`, `SUIGAR_MCP_BRIDGE_MAX_BODY_BYTES`, `SUIGAR_MCP_SESSION_SETUP_TIMEOUT_MS`, `--web-url`, `--timeout-ms`, and `--max-body-bytes`, and have bridge creation open its URL by default unless disabled.

Open both mainnet and testnet browser logout pages for `logout --all` when using the default Suigar web origins.

Update MCP package metadata and remove the static CLI tool catalog in favor of MCP protocol tool discovery.

Wire the CLI `--version` output to the bundled MCP package version.

Share MCP amount field metadata across dry-run event formatting and game-parameter formatting.
